import { Injectable } from '@nestjs/common';
import { dayRange } from '../../../common/utils/date.utils.js';
import {
  normalizeMoneyMap,
  roundAmount,
  sumMoneyByCurrency,
} from '../../../common/utils/money-map.utils.js';
import type { SaleRecovery } from '../recoveries/entities/sale-recovery.entity.js';
import type { Sale } from '../sales/entities/sale.entity.js';
import { SalePaymentType, SaleStatus } from '../sales/enums/sale.enums.js';
import { SalesService } from '../sales/sales.service.js';
import type { FindDebtsDto } from './dto/find-debts.dto.js';
import { DebtStatus } from './enums/debt-status.enum.js';

@Injectable()
export class DebtsService {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Ventes à crédit avec leur reste à payer, et les totaux affichés sur la page.
   */
  async getOverview({ startDate, endDate, includePaid }: FindDebtsDto) {
    // Les crédits actifs, avec tout ce que la SPA affiche ; les paiements du plus récent au plus ancien.
    const query = this.salesService
      .detailedQuery()
      .where('sale.payment_type = :credit', { credit: SalePaymentType.CREDIT })
      .andWhere('sale.status = :active', { active: SaleStatus.ACTIVE })
      .orderBy('sale.saleDate', 'DESC')
      .addOrderBy('recovery.recoveredAt', 'DESC');

    // La période porte sur la date de vente et couvre des journées complètes.
    if (startDate && endDate) {
      const { start, end } = dayRange(startDate, endDate);
      query.andWhere('sale.sale_date BETWEEN :start AND :end', { start, end });
    }

    const debts = (await query.getMany()).map((sale) => this.summarize(sale));

    // Par défaut, la page se concentre sur ce qui reste à payer.
    const visibleDebts = includePaid
      ? debts
      : debts.filter((debt) => debt.debtStatus !== DebtStatus.PAID);

    return { debts: visibleDebts, stats: this.buildStats(visibleDebts) };
  }

  /**
   * Total, déjà payé, reste et statut d'une vente à crédit chargée avec ses recouvrements.
   */
  summarize(sale: Sale) {
    const debtTotalAmount = sale.totalAmount;
    const recoveredAmount = this.sumRecovered(sale, sale.recoveries);

    return {
      sale,
      debtTotalAmount,
      recoveredAmount,
      // Jamais négatif, même si une ancienne donnée dépasse légèrement le total.
      remainingAmount: Math.max(
        roundAmount(debtTotalAmount - recoveredAmount),
        0,
      ),
      debtStatus: this.resolveStatus(debtTotalAmount, recoveredAmount),
    };
  }

  /**
   * Statut d'une dette d'après son total et ce qui en a été payé.
   */
  resolveStatus(totalAmount: number, recoveredAmount: number) {
    if (recoveredAmount <= 0) {
      return DebtStatus.UNPAID;
    }

    return recoveredAmount >= totalAmount
      ? DebtStatus.PAID
      : DebtStatus.PARTIAL;
  }

  /**
   * Somme des recouvrements d'une vente dans sa devise : une dette se paie toujours dans la devise de la vente.
   */
  sumRecovered(sale: Sale, recoveries: SaleRecovery[]) {
    return roundAmount(
      recoveries
        .filter((recovery) => recovery.currency === sale.currency)
        .reduce((total, recovery) => total + recovery.amount, 0),
    );
  }

  // Totaux par devise des dettes affichées : valeur, déjà payé et reste.
  private buildStats(debts: ReturnType<DebtsService['summarize']>[]) {
    return {
      totalDebts: debts.length,
      totalDebtAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          debts,
          (debt) => debt.sale.currency,
          (debt) => debt.debtTotalAmount,
        ),
      ),
      recoveredAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          debts,
          (debt) => debt.sale.currency,
          (debt) => debt.recoveredAmount,
        ),
      ),
      remainingAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          debts,
          (debt) => debt.sale.currency,
          (debt) => debt.remainingAmount,
        ),
      ),
    };
  }
}
