import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { paginateBatch } from '../../common/utils/pagination.utils.js';
import { ProductServicesService } from '../catalog/product-services/product-services.service.js';
import {
  applyDiscount,
  priceItems,
} from '../catalog/product-services/utils/pricing.utils.js';
import { CustomersService } from '../customers/customers.service.js';
import { JournalisationModule } from '../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../journalisations/journalisations.service.js';
import type { User } from '../users/entities/user.entity.js';
import { getUserDisplayName } from '../users/utils/user.utils.js';
import type { CreateUpdateProformaDto } from './dto/create-update-proforma.dto.js';
import type { FindProformasDto } from './dto/find-proformas.dto.js';
import { ProformaItem } from './entities/proforma-item.entity.js';
import { Proforma } from './entities/proforma.entity.js';
import {
  formatProformaNumber,
  PROFORMA_CUSTOMER_FIELDS,
  PROFORMA_NUMBER_LOCK,
  PROFORMAS_MAX_BATCH,
  ProformaStatus,
  proformaMonthRange,
  type NextNumberRow,
} from './utils/proforma.utils.js';

@Injectable()
export class ProformasService {
  constructor(
    @InjectRepository(Proforma)
    private readonly proformasRepository: Repository<Proforma>,
    @InjectRepository(ProformaItem)
    private readonly proformaItemsRepository: Repository<ProformaItem>,
    private readonly productServicesService: ProductServicesService,
    private readonly customersService: CustomersService,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Proformas par lot, des plus récentes aux plus anciennes, filtrables par numéro, client et statut.
   */
  async findAll({ offset, limit, search, status }: FindProformasDto) {
    const query = this.proformaQuery().orderBy('proforma.issuedAt', 'DESC');

    if (status) {
      query.andWhere('proforma.status = :status', { status });
    }

    // Le numéro (sur 3 chiffres, « 001 ») et le nom du client se cherchent en partie.
    const batch = await paginateBatch(query, {
      offset,
      limit,
      maxLimit: PROFORMAS_MAX_BATCH,
      search: {
        term: search,
        fields: [
          "LPAD(CAST(proforma.number AS text), 3, '0')",
          'customer.full_name',
        ],
      },
    });

    // Les lignes du lot sont chargées à part, sur leur propre table.
    await this.attachItems(batch.items);

    return batch;
  }

  /**
   * Une proforma avec ses lignes.
   */
  async findOne(id: string) {
    const proforma = await this.proformaQuery()
      .where('proforma.id = :id', { id })
      .getOne();

    if (!proforma) {
      throw new NotFoundException('Proforma introuvable.');
    }

    await this.attachItems([proforma]);

    return proforma;
  }

  /**
   * Émet une proforma avec un nouveau numéro.
   */
  @Transactional()
  async create(actor: User, dto: CreateUpdateProformaDto) {
    // Deux émissions simultanées ne peuvent pas lire le même « prochain numéro ».
    await this.proformasRepository.query(PROFORMA_NUMBER_LOCK);

    const { items, amounts } = await this.priceProforma(dto);
    // La date d'émission donne aussi le mois du numéro.
    const issuedAt = new Date();
    const number = await this.nextNumber(issuedAt);

    const proforma = await this.proformasRepository.save(
      this.proformasRepository.create({
        number,
        customerId: dto.customerId,
        createdById: actor.id,
        issuedAt,
        currency: dto.currency,
        ...amounts,
        status: ProformaStatus.ISSUED,
      }),
    );

    await this.proformaItemsRepository.insert(
      items.map((item) => ({ ...item, proformaId: proforma.id })),
    );

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // La création est tracée dans le journal.
      `Proforma ${formatProformaNumber(number, issuedAt)} créée par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findOne(proforma.id);
  }

  /**
   * Remplace le contenu d'une proforma tant qu'elle n'est ni convertie ni annulée.
   */
  @Transactional()
  async update(actor: User, id: string, dto: CreateUpdateProformaDto) {
    const proforma = await this.lockIssued(id, 'modifiée');
    const { items, amounts } = await this.priceProforma(dto);

    // Le numéro et la date d'émission restent ceux d'origine.
    await this.proformasRepository.update(proforma.id, {
      customerId: dto.customerId,
      currency: dto.currency,
      ...amounts,
    });

    // Les anciennes lignes sont remplacées en bloc par les nouvelles.
    await this.proformaItemsRepository.delete({ proformaId: proforma.id });
    await this.proformaItemsRepository.insert(
      items.map((item) => ({ ...item, proformaId: proforma.id })),
    );

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // La modification est tracée dans le journal.
      `Proforma ${formatProformaNumber(proforma.number, proforma.issuedAt)} modifiée par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findOne(proforma.id);
  }

  /**
   * Annule une proforma sans la supprimer : elle reste dans la liste.
   */
  @Transactional()
  async cancel(actor: User, id: string) {
    const proforma = await this.lockIssued(id, 'annulée');

    await this.proformasRepository.update(proforma.id, {
      status: ProformaStatus.CANCELLED,
    });

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // L'annulation est tracée dans le journal.
      `Proforma ${formatProformaNumber(proforma.number, proforma.issuedAt)} annulée par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findOne(proforma.id);
  }

  /**
   * Rattache la vente issue d'une proforma. Appelé dans la transaction de la vente.
   * La vente est déjà encaissée (parfois hors ligne) : une proforma entre-temps annulée
   * ou déjà convertie ne la bloque pas, elle n'est simplement pas modifiée.
   */
  async markConverted(proformaId: string, saleId: string) {
    await this.proformasRepository.update(
      { id: proformaId, status: ProformaStatus.ISSUED },
      { status: ProformaStatus.CONVERTED, saleId },
    );
  }

  // Proforma avec ses relations simples, chacune réduite à ce que la SPA affiche.
  private proformaQuery() {
    return this.proformasRepository
      .createQueryBuilder('proforma')
      .leftJoin('proforma.customer', 'customer')
      .addSelect(PROFORMA_CUSTOMER_FIELDS);
  }

  // Rattache à chaque proforma ses lignes, dans l'ordre du document.
  private async attachItems(proformas: Proforma[]) {
    // Lot vide : aucune requête.
    if (proformas.length === 0) {
      return;
    }

    const items = await this.proformaItemsRepository.find({
      where: { proformaId: In(proformas.map((proforma) => proforma.id)) },
      order: { position: 'ASC' },
    });

    for (const proforma of proformas) {
      proforma.items = items.filter((item) => item.proformaId === proforma.id);
    }
  }

  // Proforma verrouillée, encore modifiable ; sinon une erreur qui dit pourquoi.
  private async lockIssued(id: string, action: string) {
    const proforma = await this.proformasRepository
      .createQueryBuilder('proforma')
      .where('proforma.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    if (!proforma) {
      throw new NotFoundException('Proforma introuvable.');
    }

    if (proforma.status === ProformaStatus.CONVERTED) {
      throw new UnprocessableEntityException(
        `Une proforma convertie en vente ne peut plus être ${action}.`,
      );
    }

    if (proforma.status === ProformaStatus.CANCELLED) {
      throw new UnprocessableEntityException(
        `Une proforma annulée ne peut plus être ${action}.`,
      );
    }

    return proforma;
  }

  // Lignes prêtes à insérer au prix du catalogue, et montants de la proforma.
  private async priceProforma(dto: CreateUpdateProformaDto) {
    await this.customersService.ensureActive(dto.customerId);
    const services = await this.productServicesService.findSellableServices(
      dto.items.map((item) => item.productServiceId),
    );

    const { pricedItems, theoreticalAmount } = priceItems(
      dto.items,
      services,
      dto.currency,
    );

    const items = pricedItems.map(
      ({ item, service, unitPrice, totalPrice }, index) => ({
        productServiceId: service.id,
        position: index + 1,
        // Le nom du service est figé sur la ligne : un renommage ne change pas la proforma.
        designation: service.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      }),
    );

    return {
      items,
      amounts: applyDiscount(theoreticalAmount, dto.discountAmount),
    };
  }

  // Prochain numéro du mois de la date : il repart à 1 au premier jour du mois. Le verrou doit être pris.
  private async nextNumber(date: Date) {
    const { start, end } = proformaMonthRange(date);
    const [row] = await this.proformasRepository.query<NextNumberRow[]>(
      `SELECT COALESCE(MAX(number), 0) + 1 AS next_number
       FROM proformas
       WHERE issued_at >= $1 AND issued_at < $2`,
      [start, end],
    );

    return Number(row?.next_number ?? 1);
  }
}
