import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { isUniqueViolation } from '../../../common/database/database-error.utils.js';
import { Currency } from '../../../common/enums/currency.enum.js';
import { dayRange } from '../../../common/utils/date.utils.js';
import { roundAmount } from '../../../common/utils/money-map.utils.js';
import { ProductService } from '../../catalog/product-services/entities/product-service.entity.js';
import { ProductServiceType } from '../../catalog/product-services/enums/product-service-type.enum.js';
import { Customer } from '../../customers/entities/customer.entity.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import { User } from '../../users/entities/user.entity.js';
import { UserRole, UserStatus } from '../../users/enums/user.enums.js';
import {
  getUserDisplayName,
  userSummaryFields,
} from '../../users/utils/user.utils.js';
import { AdditionNumbersService } from '../addition-numbers/addition-numbers.service.js';
import { CashSession } from '../cash-sessions/entities/cash-session.entity.js';
import { CashSessionStatus } from '../cash-sessions/enums/cash-session-status.enum.js';
import { SaleRecovery } from '../recoveries/entities/sale-recovery.entity.js';
import type { CreateSaleDto } from './dto/create-sale.dto.js';
import type { FindSalesDto } from './dto/find-sales.dto.js';
import { SaleItem } from './entities/sale-item.entity.js';
import { Sale } from './entities/sale.entity.js';
import { SalePaymentType, SaleStatus } from './enums/sale.enums.js';

// Nombre maximum de ventes renvoyées par lot dans l'historique.
const SALES_HISTORY_MAX_BATCH = 40;

// Colonnes des relations jointes à une vente : de quoi l'afficher sur le ticket, rien de plus.
const CASH_SESSION_SUMMARY_FIELDS = ['cashSession.id', 'cashSession.status'];
const CUSTOMER_SUMMARY_FIELDS = ['customer.id', 'customer.fullName'];
const PRODUCT_SERVICE_SUMMARY_FIELDS = [
  'productService.id',
  'productService.name',
];

type SaleCountRow = { stats_total: number };

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(SaleRecovery)
    private readonly recoveriesRepository: Repository<SaleRecovery>,
    @InjectRepository(CashSession)
    private readonly cashSessionsRepository: Repository<CashSession>,
    @InjectRepository(ProductService)
    private readonly productServicesRepository: Repository<ProductService>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly additionNumbersService: AdditionNumbersService,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Historique des ventes par lot, toutes caisses et tous statuts, pour retrouver et réimprimer une addition.
   */
  async findHistory({
    offset = 0,
    limit = SALES_HISTORY_MAX_BATCH,
    facturationDate,
    additionNumber,
    status,
  }: FindSalesDto) {
    // Le lot est borné pour protéger l'API.
    const batchLimit = Math.min(limit, SALES_HISTORY_MAX_BATCH);

    // Une seule requête sur les ventes : le lot, ses relations simples et le total filtré.
    // Sans jointure multiple, le LIMIT porte bien sur les ventes et « over () » compte avant lui.
    const query = this.saleQuery()
      .addSelect('count(*) over ()::int', 'stats_total')
      .orderBy('sale.saleDate', 'DESC')
      .offset(offset)
      .limit(batchLimit);

    // Ventes d'une journée de facturation, à l'heure de Kinshasa.
    if (facturationDate) {
      const { start, end } = dayRange(facturationDate);
      query.andWhere('sale.sale_date BETWEEN :start AND :end', { start, end });
    }

    // Recherche partielle sur le numéro d'addition.
    if (additionNumber) {
      query.andWhere('sale.addition_number ILIKE :additionNumber', {
        additionNumber: `%${additionNumber}%`,
      });
    }

    if (status) {
      query.andWhere('sale.status = :status', { status });
    }

    const { entities: sales, raw } =
      await query.getRawAndEntities<SaleCountRow>();

    // Le total est répété sur chaque ligne ; un lot vide ne le porte pas.
    const totalItems = raw[0]?.stats_total ?? 0;

    // Les lignes et les recouvrements du lot sont chargés à part, sur leurs propres tables.
    await this.attachItemsAndRecoveries(sales);

    return {
      items: sales,
      pagination: { offset, limit: batchLimit, totalItems },
    };
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

    // La caisse est verrouillée en lecture : une clôture attend la fin de cette vente.
    const cashSession = await this.resolveCashSession(dto);

    await this.ensureCustomerRules(dto);
    await this.ensureOperatorIsValid(dto.operatorId);

    // Les prix viennent toujours du catalogue, jamais du client.
    const { items, theoreticalAmount } = await this.prepareItems(dto);
    const discountAmount = roundAmount(dto.discountAmount ?? 0);

    // La remise vient du montant à payer saisi et ne peut jamais dépasser le brut.
    if (discountAmount > theoreticalAmount) {
      throw new UnprocessableEntityException(
        'La remise ne peut pas dépasser le total de la vente.',
      );
    }

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

    // Une fois la caisse fermée, l'addition est figée dans le rapport de clôture.
    const cashSession = await this.cashSessionsRepository.findOneOrFail({
      where: { id: sale.cashSessionId },
    });

    if (cashSession.status === CashSessionStatus.CLOSED) {
      throw new UnprocessableEntityException(
        "Impossible d'annuler une vente dont la session de caisse est fermée.",
      );
    }

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

  // Charge une vente avec tout ce que la SPA affiche sur le ticket.
  private async findResponse(id: string) {
    // Une seule vente : ses lignes et recouvrements viennent dans la même requête.
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
      ])
      .where('sale.id = :id', { id })
      .getOneOrFail();
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

  // Session sur laquelle la vente est enregistrée, verrouillée en lecture jusqu'à la fin de la transaction.
  private async resolveCashSession(dto: CreateSaleDto) {
    const query = this.cashSessionsRepository
      .createQueryBuilder('session')
      .setLock('pessimistic_read');

    // Le client indique la caisse sur laquelle il a vendu : c'est la seule façon de rattacher
    // une vente hors ligne à la bonne caisse si une autre a été ouverte depuis.
    if (dto.cashSessionId) {
      const session = await query
        .where('session.id = :id', { id: dto.cashSessionId })
        .getOne();

      if (!session) {
        throw new UnprocessableEntityException(
          'La session de caisse sélectionnée est invalide.',
        );
      }

      // Une vente faite pendant la session mais reçue après sa clôture reste acceptée :
      // elle a déjà été encaissée et son ticket imprimé.
      if (
        session.status === CashSessionStatus.OPEN ||
        this.wasSoldDuringSession(session, dto.saleDate)
      ) {
        return session;
      }

      throw new UnprocessableEntityException(
        'La session de caisse est fermée. Ouvrez une nouvelle session pour vendre.',
      );
    }

    // Sans caisse indiquée, la vente va sur la session ouverte.
    const openSession = await query
      .where('session.status = :open', { open: CashSessionStatus.OPEN })
      .getOne();

    if (!openSession) {
      throw new UnprocessableEntityException(
        'Ouvrez une session de caisse avant de créer une vente.',
      );
    }

    return openSession;
  }

  // Vrai si la date de vente tombe entre l'ouverture et la clôture de la session.
  private wasSoldDuringSession(session: CashSession, saleDate: string | null) {
    if (!saleDate || !session.closedAt) {
      return false;
    }

    const soldAt = new Date(saleDate);

    return soldAt >= session.openedAt && soldAt <= session.closedAt;
  }

  // Le client est obligatoire pour tracer les crédits, les offerts et les remises ; s'il est donné, il doit être actif.
  private async ensureCustomerRules(dto: CreateSaleDto) {
    const requiresCustomer =
      dto.paymentType === SalePaymentType.CREDIT ||
      dto.paymentType === SalePaymentType.OFFERED ||
      (dto.discountAmount ?? 0) > 0;

    if (requiresCustomer && !dto.customerId) {
      throw new UnprocessableEntityException(
        'Sélectionnez un client pour une vente à crédit, offerte ou avec remise.',
      );
    }

    // Sans client, il n'y a rien d'autre à vérifier.
    if (!dto.customerId) {
      return;
    }

    const isActive = await this.customersRepository.exists({
      where: { id: dto.customerId, isActive: true },
    });

    if (!isActive) {
      throw new UnprocessableEntityException(
        'Le client sélectionné est invalide ou inactif.',
      );
    }
  }

  // Tout utilisateur actif peut être opérateur de la commande, sauf l'administrateur.
  private async ensureOperatorIsValid(operatorId: string) {
    const isValid = await this.usersRepository.exists({
      where: {
        id: operatorId,
        role: Not(UserRole.ADMIN),
        status: UserStatus.ACTIVE,
      },
    });

    if (!isValid) {
      throw new UnprocessableEntityException(
        "L'opérateur sélectionné est invalide ou inactif.",
      );
    }
  }

  // Lignes prêtes à insérer, au prix du catalogue dans la devise de la vente, et leur total.
  private async prepareItems(dto: CreateSaleDto) {
    const serviceIds = dto.items.map((item) => item.productServiceId);

    // Un service ne figure qu'une fois par vente.
    if (new Set(serviceIds).size !== serviceIds.length) {
      throw new UnprocessableEntityException(
        'Un service ne peut pas être ajouté plusieurs fois dans la même vente.',
      );
    }

    // Seuls les services actifs se vendent.
    const services = await this.productServicesRepository.find({
      where: {
        id: In(serviceIds),
        type: ProductServiceType.SERVICE,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new UnprocessableEntityException(
        'Un ou plusieurs services sélectionnés sont invalides ou inactifs.',
      );
    }

    const servicesById = new Map(
      services.map((service) => [service.id, service]),
    );

    const items = dto.items.map((item) => {
      const service = servicesById.get(item.productServiceId)!;

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
