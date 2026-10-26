import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { isUniqueViolation } from '../../../common/database/database-error.utils.js';
import { Currency } from '../../../common/enums/currency.enum.js';
import { dayRange } from '../../../common/utils/date.utils.js';
import { roundAmount } from '../../../common/utils/money-map.utils.js';
import { paginateBatch } from '../../../common/utils/pagination.utils.js';
import type { ProductService } from '../../catalog/product-services/entities/product-service.entity.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import type { User } from '../../users/entities/user.entity.js';
import {
  getUserDisplayName,
  userSummaryFields,
} from '../../users/utils/user.utils.js';
import { AdditionNumbersService } from '../addition-numbers/addition-numbers.service.js';
import { SaleRecovery } from '../recoveries/entities/sale-recovery.entity.js';
import type { CreateSaleDto } from './dto/create-sale.dto.js';
import type { FindSalesDto } from './dto/find-sales.dto.js';
import { SaleItem } from './entities/sale-item.entity.js';
import { Sale } from './entities/sale.entity.js';
import { SalePaymentType, SaleStatus } from './enums/sale.enums.js';
import { SaleValidationService } from './sale-validation.service.js';

// Nombre maximum de ventes renvoyées par lot dans l'historique.
const SALES_HISTORY_MAX_BATCH = 40;

// Colonnes des relations jointes à une vente : de quoi l'afficher sur le ticket, rien de plus.
const CASH_SESSION_SUMMARY_FIELDS = ['cashSession.id', 'cashSession.status'];
const CUSTOMER_SUMMARY_FIELDS = ['customer.id', 'customer.fullName'];
const PRODUCT_SERVICE_SUMMARY_FIELDS = [
  'productService.id',
  'productService.name',
];

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(SaleRecovery)
    private readonly recoveriesRepository: Repository<SaleRecovery>,
    private readonly saleValidationService: SaleValidationService,
    private readonly additionNumbersService: AdditionNumbersService,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Historique des ventes par lot, toutes caisses et tous statuts, pour retrouver et réimprimer une addition.
   */
  async findHistory({
    offset,
    limit,
    facturationDate,
    additionNumber,
    status,
  }: FindSalesDto) {
    // Seules les relations simples sont jointes : le lot et son total restent justes.
    const query = this.saleQuery().orderBy('sale.saleDate', 'DESC');

    // Ventes d'une journée de facturation, à l'heure de Kinshasa.
    if (facturationDate) {
      const { start, end } = dayRange(facturationDate);
      query.andWhere('sale.sale_date BETWEEN :start AND :end', { start, end });
    }

    if (status) {
      query.andWhere('sale.status = :status', { status });
    }

    // Le numéro d'addition se cherche en partie : « 12 » trouve 00012 et 00120.
    const batch = await paginateBatch(query, {
      offset,
      limit,
      maxLimit: SALES_HISTORY_MAX_BATCH,
      search: { term: additionNumber, fields: ['sale.addition_number'] },
    });

    // Les lignes et les recouvrements du lot sont chargés à part, sur leurs propres tables.
    await this.attachItemsAndRecoveries(batch.items);

    return batch;
  }

  /**
   * Crée une vente et ses lignes. Rejouable : un id déjà enregistré renvoie la vente existante.
   */
  @Transactional()
  async create(actor: User, dto: CreateSaleDto) {
    // Les créations de vente passent l'une après l'autre : rejeu et numérotation ne peuvent pas se croiser.
    await this.additionNumbersService.lock();

    // Un client hors ligne qui renvoie sa vente reçoit celle déjà créée, sans doublon.
    if (dto.id) {
      const replayed = await this.findReplayedSale(actor, dto.id);

      if (replayed) {
        return replayed;
      }
    }

    // Caisse, client, opérateur et services sont vérifiés avant tout calcul.
    const { cashSession, services } =
      await this.saleValidationService.validateCreateSale(dto);

    // Les prix viennent toujours du catalogue, jamais du client.
    const { items, theoreticalAmount } = this.priceItems(dto, services);
    const discountAmount = roundAmount(dto.discountAmount ?? 0);

    this.saleValidationService.ensureDiscountWithinTotal(
      discountAmount,
      theoreticalAmount,
    );

    // Numéro pris dans la plage de la caisse hors ligne, sinon attribué par le serveur.
    const additionNumber = dto.additionNumber
      ? await this.useReservedNumber(
          cashSession.id,
          actor.id,
          dto.additionNumber,
        )
      : await this.additionNumbersService.generateOnlineNumber();

    // Seule une vente payée tout de suite a un mode de paiement ; un crédit se règle par recouvrement.
    const isPaidNow = dto.paymentType === SalePaymentType.CASH;

    const sale = await this.insertSale({
      ...(dto.id ? { id: dto.id } : {}),
      cashSessionId: cashSession.id,
      customerId: dto.customerId,
      operatorId: dto.operatorId,
      sellerId: actor.id,
      paymentType: dto.paymentType,
      paymentMethod: isPaidNow ? dto.paymentMethod : null,
      paymentReference: isPaidNow ? dto.paymentReference : null,
      additionNumber,
      // L'heure réelle de la vente hors ligne est conservée ; sinon celle du serveur.
      saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
      currency: dto.currency,
      theoreticalAmount,
      discountAmount,
      totalAmount: roundAmount(theoreticalAmount - discountAmount),
      status: SaleStatus.ACTIVE,
    });

    // Les lignes gardent le service et les montants calculés.
    await this.saleItemsRepository.insert(
      items.map((item) => ({ ...item, saleId: sale.id })),
    );

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // La création est tracée dans le journal.
      `Addition ${sale.additionNumber} créée par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findResponse(sale.id);
  }

  /**
   * Annule une vente sans la supprimer : elle reste dans l'historique et sort des totaux.
   */
  @Transactional()
  async cancel(actor: User, id: string) {
    // La vente est verrouillée pour que deux annulations ne se croisent pas.
    const sale = await this.salesRepository
      .createQueryBuilder('sale')
      .where('sale.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    if (!sale) {
      throw new NotFoundException('Vente introuvable.');
    }

    // Déjà annulée : rien à faire, la vente est renvoyée telle quelle.
    if (sale.status === SaleStatus.CANCELLED) {
      return this.findResponse(sale.id);
    }

    // Une vente d'une caisse fermée ne s'annule plus.
    await this.saleValidationService.ensureCanBeCancelled(sale);

    await this.salesRepository.update(sale.id, {
      status: SaleStatus.CANCELLED,
    });

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // L'annulation est tracée dans le journal.
      `Addition ${sale.additionNumber} annulée par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findResponse(sale.id);
  }

  // Vente avec ses relations simples, chacune réduite à ce que la SPA affiche.
  private saleQuery() {
    return this.salesRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.cashSession', 'cashSession')
      .leftJoin('sale.customer', 'customer')
      .leftJoin('sale.operator', 'operator')
      .leftJoin('sale.seller', 'seller')
      .addSelect([
        ...CASH_SESSION_SUMMARY_FIELDS,
        ...CUSTOMER_SUMMARY_FIELDS,
        ...userSummaryFields('operator'),
        ...userSummaryFields('seller'),
      ]);
  }

  /**
   * Ventes avec tout ce que la SPA affiche : relations simples, lignes et recouvrements.
   * À réserver aux listes non paginées : les lignes et recouvrements multiplient les rangées.
   */
  detailedQuery() {
    return this.saleQuery()
      .leftJoin('sale.items', 'item')
      .leftJoin('item.productService', 'productService')
      .leftJoin('sale.recoveries', 'recovery')
      .leftJoin('recovery.receivedBy', 'receivedBy')
      .addSelect([
        'item',
        ...PRODUCT_SERVICE_SUMMARY_FIELDS,
        'recovery',
        ...userSummaryFields('receivedBy'),
      ]);
  }

  // Charge une vente avec tout ce que la SPA affiche sur le ticket.
  private async findResponse(id: string) {
    // Une seule vente : ses lignes et recouvrements viennent dans la même requête.
    return this.detailedQuery().where('sale.id = :id', { id }).getOneOrFail();
  }

  // Vente déjà enregistrée sous cet id, ou null. Un id pris par un autre vendeur est un conflit.
  private async findReplayedSale(actor: User, id: string) {
    const existing = await this.salesRepository.findOne({
      select: { id: true, sellerId: true },
      where: { id },
    });

    // Id inconnu : c'est une vraie création.
    if (!existing) {
      return null;
    }

    // On refuse plutôt que d'exposer la vente de quelqu'un d'autre.
    if (existing.sellerId !== actor.id) {
      throw new UnprocessableEntityException(
        'Cet identifiant de vente est déjà utilisé.',
      );
    }

    return this.findResponse(existing.id);
  }

  // Lignes prêtes à insérer, au prix du catalogue dans la devise de la vente, et leur total.
  private priceItems(
    dto: CreateSaleDto,
    services: Map<string, ProductService>,
  ) {
    const items = dto.items.map((item) => {
      // Les services ont été vérifiés : chaque ligne a le sien.
      const service = services.get(item.productServiceId)!;

      // Le prix unitaire est celui du catalogue dans la devise de la vente.
      const unitPrice =
        dto.currency === Currency.USD ? service.priceUsd : service.priceCdf;

      return {
        productServiceId: service.id,
        quantity: item.quantity,
        currency: dto.currency,
        unitPrice,
        totalPrice: roundAmount(unitPrice * item.quantity),
      };
    });

    // Le total brut se déduit uniquement des lignes.
    const theoreticalAmount = roundAmount(
      items.reduce((sum, item) => sum + item.totalPrice, 0),
    );

    return { items, theoreticalAmount };
  }

  // Numéro émis hors ligne : il doit appartenir à une plage du vendeur dans cette session.
  private async useReservedNumber(
    cashSessionId: string,
    sellerId: string,
    additionNumber: string,
  ) {
    await this.additionNumbersService.assertReservedFor(
      cashSessionId,
      sellerId,
      additionNumber,
    );

    return this.additionNumbersService.format(Number(additionNumber));
  }

  // Enregistre l'en-tête ; un numéro déjà pris devient une erreur lisible.
  private async insertSale(fields: Partial<Sale>) {
    try {
      return await this.salesRepository.save(
        this.salesRepository.create(fields),
      );
    } catch (error) {
      // Seul le même numéro renvoyé avec un autre id peut buter ici : le verrou exclut le reste.
      if (isUniqueViolation(error, 'sales_addition_number_unique')) {
        throw new UnprocessableEntityException(
          `Le numéro d'addition ${fields.additionNumber} est déjà utilisé.`,
        );
      }

      throw error;
    }
  }

  // Rattache à chaque vente du lot ses lignes (avec service) et ses recouvrements (avec encaisseur).
  private async attachItemsAndRecoveries(sales: Sale[]) {
    // Lot vide : aucune requête.
    if (sales.length === 0) {
      return;
    }

    const saleIds = sales.map((sale) => sale.id);
    const items = await this.saleItemsRepository
      .createQueryBuilder('item')
      .leftJoin('item.productService', 'productService')
      .addSelect(PRODUCT_SERVICE_SUMMARY_FIELDS)
      .where('item.sale_id IN (:...saleIds)', { saleIds })
      .getMany();
    const recoveries = await this.recoveriesRepository
      .createQueryBuilder('recovery')
      .leftJoin('recovery.receivedBy', 'receivedBy')
      .addSelect(userSummaryFields('receivedBy'))
      .where('recovery.sale_id IN (:...saleIds)', { saleIds })
      .orderBy('recovery.recoveredAt', 'DESC')
      .getMany();

    // Chaque vente reçoit les siennes, dans l'ordre de lecture.
    for (const sale of sales) {
      sale.items = items.filter((item) => item.saleId === sale.id);
      sale.recoveries = recoveries.filter(
        (recovery) => recovery.saleId === sale.id,
      );
    }
  }
}
