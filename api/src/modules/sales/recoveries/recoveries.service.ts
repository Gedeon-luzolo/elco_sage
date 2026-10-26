import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import type { PeriodDto } from '../../../common/dto/period.dto.js';
import { dayRange } from '../../../common/utils/date.utils.js';
import {
  normalizeMoneyMap,
  roundAmount,
  sumMoneyByCurrency,
} from '../../../common/utils/money-map.utils.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import type { User } from '../../users/entities/user.entity.js';
import {
  getUserDisplayName,
  userSummaryFields,
} from '../../users/utils/user.utils.js';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service.js';
import { DebtsService } from '../debts/debts.service.js';
import { Sale } from '../sales/entities/sale.entity.js';
import { SalePaymentType, SaleStatus } from '../sales/enums/sale.enums.js';
import { SalesService } from '../sales/sales.service.js';
import type { CreateSaleRecoveryDto } from './dto/create-sale-recovery.dto.js';
import { SaleRecovery } from './entities/sale-recovery.entity.js';

@Injectable()
export class RecoveriesService {
  constructor(
    @InjectRepository(SaleRecovery)
    private readonly recoveriesRepository: Repository<SaleRecovery>,
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    private readonly salesService: SalesService,
    private readonly debtsService: DebtsService,
    private readonly cashSessionsService: CashSessionsService,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Enregistre un paiement sur une vente à crédit. Rejouable : un id déjà enregistré n'est pas recréé.
   */
  @Transactional()
  async create(actor: User, saleId: string, dto: CreateSaleRecoveryDto) {
    // La vente est verrouillée : deux paiements simultanés passent l'un après l'autre.
    const sale = await this.salesRepository
      .createQueryBuilder('sale')
      .where('sale.id = :saleId', { saleId })
      .setLock('pessimistic_write')
      .getOne();

    if (!sale) {
      throw new NotFoundException('Vente introuvable.');
    }

    // Lus après le verrou, dans une requête à part : une jointure garderait l'image d'avant
    // l'attente et ne verrait pas le paiement que l'autre requête vient d'enregistrer.
    sale.recoveries = await this.recoveriesRepository.find({
      where: { saleId: sale.id },
    });

    // Un client hors ligne qui renvoie son paiement ne le paie pas deux fois.
    if (dto.id) {
      const replayed = sale.recoveries.find(
        (recovery) => recovery.id === dto.id,
      );

      if (replayed) {
        this.ensureReplayBelongsTo(actor, replayed);
        return { id: replayed.id };
      }

      // L'id existe peut-être sur une autre vente : c'est un conflit.
      await this.ensureIdIsFree(dto.id);
    }

    this.ensureSaleCanReceiveRecovery(sale, dto);

    // La caisse est partagée : le paiement entre dans la session ouverte, quel que soit son ouvreur.
    const cashSession = await this.cashSessionsService.lockOpenSession();

    if (!cashSession) {
      throw new UnprocessableEntityException(
        'Ouvrez une session de caisse avant de faire un recouvrement.',
      );
    }

    const amount = roundAmount(dto.amount);
    const recovery = await this.recoveriesRepository.save(
      this.recoveriesRepository.create({
        ...(dto.id ? { id: dto.id } : {}),
        saleId: sale.id,
        cashSessionId: cashSession.id,
        receivedById: actor.id,
        amount,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        // L'heure réelle du paiement hors ligne est conservée ; sinon celle du serveur.
        recoveredAt: dto.recoveredAt ? new Date(dto.recoveredAt) : new Date(),
      }),
    );

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // Le paiement est tracé dans le journal.
      `Recouvrement de ${amount} ${dto.currency} enregistré sur l'addition ${sale.additionNumber} par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return { id: recovery.id };
  }

  /**
   * Historique des paiements de dettes sur la période, avec l'état de la dette après chacun.
   */
  async getHistory({ startDate, endDate }: PeriodDto) {
    // Une ligne par paiement, du plus récent au plus ancien, sur les seuls crédits actifs.
    const query = this.recoveriesRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.sale', 'paidSale')
      .leftJoin('payment.receivedBy', 'paymentReceivedBy')
      .addSelect(userSummaryFields('paymentReceivedBy'))
      .where('paidSale.payment_type = :credit', {
        credit: SalePaymentType.CREDIT,
      })
      .andWhere('paidSale.status = :active', { active: SaleStatus.ACTIVE })
      .orderBy('payment.recoveredAt', 'DESC');

    // La période porte sur la date de paiement, pas sur la date de vente.
    if (startDate && endDate) {
      const { start, end } = dayRange(startDate, endDate);
      query.andWhere('payment.recovered_at BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    const payments = await query.getMany();
    const sales = await this.findPaidSales(payments);

    // Chaque paiement porte sa vente et l'état de la dette juste après lui.
    const history = payments.map((payment) =>
      this.buildPaymentSummary(payment, sales.get(payment.saleId)!),
    );

    return { recoveries: history, stats: this.buildStats(history) };
  }

  // Ventes des paiements, avec tous leurs recouvrements dans l'ordre chronologique.
  private async findPaidSales(payments: SaleRecovery[]) {
    // Aucun paiement : aucune vente à charger.
    if (payments.length === 0) {
      return new Map<string, Sale>();
    }

    const saleIds = [...new Set(payments.map((payment) => payment.saleId))];
    const sales = await this.salesService
      .detailedQuery()
      .where('sale.id IN (:...saleIds)', { saleIds })
      .orderBy('recovery.recoveredAt', 'ASC')
      .getMany();

    return new Map(sales.map((sale) => [sale.id, sale]));
  }

  // Montant du paiement, cumul payé jusqu'à lui, reste et statut à ce moment-là.
  private buildPaymentSummary(payment: SaleRecovery, sale: Sale) {
    // Les paiements de la vente jusqu'à celui-ci compris (ils sont triés du plus ancien au plus récent).
    const paymentIndex = sale.recoveries.findIndex(
      (recovery) => recovery.id === payment.id,
    );
    const paidAfterAmount = this.debtsService.sumRecovered(
      sale,
      sale.recoveries.slice(0, paymentIndex + 1),
    );

    return {
      recovery: payment,
      sale,
      debtTotalAmount: sale.totalAmount,
      paidAmount: payment.amount,
      paidAfterAmount,
      remainingAmount: Math.max(
        roundAmount(sale.totalAmount - paidAfterAmount),
        0,
      ),
      debtStatus: this.debtsService.resolveStatus(
        sale.totalAmount,
        paidAfterAmount,
      ),
    };
  }

  // Totaux de la page : valeur des dettes concernées, total payé sur la période et reste actuel.
  private buildStats(
    history: ReturnType<RecoveriesService['buildPaymentSummary']>[],
  ) {
    // Une vente payée plusieurs fois dans la période ne compte qu'une fois.
    const sales = [
      ...new Map(history.map((row) => [row.sale.id, row.sale])).values(),
    ];

    return {
      totalDebts: history.length,
      totalDebtAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          sales,
          (sale) => sale.currency,
          (sale) => sale.totalAmount,
        ),
      ),
      recoveredAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          history,
          (row) => row.recovery.currency,
          (row) => row.paidAmount,
        ),
      ),
      // Le reste est celui d'aujourd'hui, tous paiements compris, même hors de la période.
      remainingAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          sales,
          (sale) => sale.currency,
          (sale) => this.debtsService.summarize(sale).remainingAmount,
        ),
      ),
    };
  }

  // Seul l'encaisseur d'origine peut rejouer son paiement.
  private ensureReplayBelongsTo(actor: User, recovery: SaleRecovery) {
    if (recovery.receivedById !== actor.id) {
      throw new UnprocessableEntityException(
        'Cet identifiant de recouvrement est déjà utilisé.',
      );
    }
  }

  // Un id déjà pris par un paiement d'une autre vente est refusé.
  private async ensureIdIsFree(id: string) {
    const taken = await this.recoveriesRepository.exists({ where: { id } });

    if (taken) {
      throw new UnprocessableEntityException(
        'Cet identifiant de recouvrement est déjà utilisé.',
      );
    }
  }

  // Seule une vente à crédit active se recouvre, dans sa devise et sans dépasser le reste dû.
  private ensureSaleCanReceiveRecovery(sale: Sale, dto: CreateSaleRecoveryDto) {
    if (sale.status === SaleStatus.CANCELLED) {
      throw new UnprocessableEntityException(
        'Impossible de recouvrer une vente annulée.',
      );
    }

    if (sale.paymentType !== SalePaymentType.CREDIT) {
      throw new UnprocessableEntityException(
        'Les recouvrements sont réservés aux ventes à crédit.',
      );
    }

    // Une dette se paie dans la devise de la vente, sans conversion implicite.
    if (dto.currency !== sale.currency) {
      throw new UnprocessableEntityException(
        'Le paiement doit être effectué dans la devise de la vente.',
      );
    }

    if (
      roundAmount(dto.amount) >
      this.debtsService.summarize(sale).remainingAmount
    ) {
      throw new UnprocessableEntityException(
        'Le paiement dépasse le reste de la dette.',
      );
    }
  }
}
