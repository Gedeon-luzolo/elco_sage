import { Injectable } from '@nestjs/common';
import { Currency } from '../../../common/enums/currency.enum.js';
import { toDateKey, toDayLabel } from '../../../common/utils/date.utils.js';
import {
  addMoneyAmount,
  emptyMoneyMap,
  normalizeMoneyMap,
  sumMoneyMaps,
} from '../../../common/utils/money-map.utils.js';
import { getUserDisplayName } from '../../users/utils/user.utils.js';
import { DebtsService } from '../../sales/debts/debts.service.js';
import type { SaleRecovery } from '../../sales/recoveries/entities/sale-recovery.entity.js';
import type { Sale } from '../../sales/sales/entities/sale.entity.js';
import { SalePaymentType } from '../../sales/sales/enums/sale.enums.js';

// Montants vides, par devise, de chaque indicateur du pilotage.
function createAmounts() {
  return {
    theoreticalAmounts: emptyMoneyMap(),
    offeredAmounts: emptyMoneyMap(),
    discountAmounts: emptyMoneyMap(),
    realAmounts: emptyMoneyMap(),
    cashAmounts: emptyMoneyMap(),
    creditAmounts: emptyMoneyMap(),
    remainingDebtAmounts: emptyMoneyMap(),
    recoveryAmounts: emptyMoneyMap(),
    collectionAmounts: emptyMoneyMap(),
  };
}

type DashboardAmounts = ReturnType<typeof createAmounts>;

@Injectable()
export class DashboardReportsService {
  constructor(private readonly debtsService: DebtsService) {}

  /**
   * Cartes principales : compteurs par type de paiement et montants de toute la période.
   */
  buildStats(sales: Sale[], recoveries: SaleRecovery[]) {
    const amounts = this.accumulate(sales, recoveries);

    return {
      salesCount: sales.length,
      cashSalesCount: this.countByType(sales, SalePaymentType.CASH),
      creditSalesCount: this.countByType(sales, SalePaymentType.CREDIT),
      offeredSalesCount: this.countByType(sales, SalePaymentType.OFFERED),
      ...amounts,
    };
  }

  /**
   * Une ligne par jour de la période, même sans vente, avec ses montants et compteurs.
   */
  buildPeriodicReports(
    days: string[],
    sales: Sale[],
    recoveries: SaleRecovery[],
  ) {
    // Chaque jour démarre à zéro : le rapport reste continu, sans trou.
    const reports = new Map(
      days.map((date) => [
        date,
        {
          date,
          label: toDayLabel(date),
          ...createAmounts(),
          additionsCount: 0,
          soldServicesCount: 0,
        },
      ]),
    );

    // Une vente compte au jour où elle a été faite, à l'heure de Kinshasa.
    for (const sale of sales) {
      const report = reports.get(toDateKey(sale.saleDate))!;

      this.addSale(report, sale);
      report.additionsCount += 1;
      // Les services vendus sont la somme des quantités des lignes.
      report.soldServicesCount += sale.items.reduce(
        (total, item) => total + item.quantity,
        0,
      );
    }

    // Un recouvrement compte au jour du paiement, pas à celui de la vente.
    for (const recovery of recoveries) {
      this.addRecovery(reports.get(toDateKey(recovery.recoveredAt))!, recovery);
    }

    return [...reports.values()].map((report) => this.closeAmounts(report));
  }

  /**
   * Ventes attribuées à leur opérateur, recouvrements à celui qui les a perçus, et une ligne de total.
   */
  buildStaffProductivity(sales: Sale[], recoveries: SaleRecovery[]) {
    const rows = new Map<
      string,
      DashboardAmounts & {
        staffId: string;
        staffName: string;
        additionsCount: number;
      }
    >();

    // Une ligne est créée à la première vente ou au premier paiement rencontré.
    const rowFor = (staffId: string, staffName: string) => {
      if (!rows.has(staffId)) {
        rows.set(staffId, {
          staffId,
          staffName,
          additionsCount: 0,
          ...createAmounts(),
        });
      }

      return rows.get(staffId)!;
    };

    for (const sale of sales) {
      const row = rowFor(
        sale.operatorId,
        getUserDisplayName(sale.operator) ?? 'Opérateur',
      );

      row.additionsCount += 1;
      this.addSale(row, sale);
    }

    for (const recovery of recoveries) {
      this.addRecovery(
        rowFor(
          recovery.receivedById,
          getUserDisplayName(recovery.receivedBy) ?? 'Agent',
        ),
        recovery,
      );
    }

    return {
      // Les plus actifs d'abord, puis par nom.
      rows: [...rows.values()]
        .map((row) => this.closeAmounts(row))
        .sort(
          (first, second) =>
            second.additionsCount - first.additionsCount ||
            first.staffName.localeCompare(second.staffName),
        ),
      // Le total reprend toutes les ventes et tous les paiements de la période.
      totals: {
        staffId: 'total',
        staffName: 'Total',
        additionsCount: sales.length,
        ...this.accumulate(sales, recoveries),
      },
    };
  }

  /**
   * Nombre de ventes et montant encaissé par type de paiement, du plus fréquent au moins fréquent.
   */
  buildPaymentDistribution(sales: Sale[]) {
    const distribution = new Map<
      SalePaymentType,
      {
        paymentType: SalePaymentType;
        count: number;
        amountCdf: number;
        amountUsd: number;
      }
    >();

    for (const sale of sales) {
      const item = distribution.get(sale.paymentType) ?? {
        paymentType: sale.paymentType,
        count: 0,
        amountCdf: 0,
        amountUsd: 0,
      };

      item.count += 1;
      // Chaque devise garde son propre total.
      if (sale.currency === Currency.CDF) item.amountCdf += sale.totalAmount;
      if (sale.currency === Currency.USD) item.amountUsd += sale.totalAmount;
      distribution.set(sale.paymentType, item);
    }

    return [...distribution.values()].sort(
      (first, second) => second.count - first.count,
    );
  }

  /**
   * Services les plus vendus, classés par montant vendu.
   */
  buildTopServices(sales: Sale[], limit: number) {
    const services = new Map<
      string,
      {
        id: string;
        name: string;
        quantity: number;
        amountCdf: number;
        amountUsd: number;
      }
    >();

    for (const item of sales.flatMap((sale) => sale.items)) {
      const service = services.get(item.productServiceId) ?? {
        id: item.productServiceId,
        name: item.productService?.name ?? 'Service',
        quantity: 0,
        amountCdf: 0,
        amountUsd: 0,
      };

      service.quantity += item.quantity;
      if (item.currency === Currency.CDF) service.amountCdf += item.totalPrice;
      if (item.currency === Currency.USD) service.amountUsd += item.totalPrice;
      services.set(item.productServiceId, service);
    }

    // Les deux devises sont additionnées telles quelles pour le classement seulement.
    return [...services.values()]
      .sort(
        (first, second) =>
          second.amountCdf +
          second.amountUsd -
          (first.amountCdf + first.amountUsd),
      )
      .slice(0, limit);
  }

  // Montants de toutes les ventes et de tous les paiements, prêts à afficher.
  private accumulate(sales: Sale[], recoveries: SaleRecovery[]) {
    const amounts = createAmounts();

    sales.forEach((sale) => this.addSale(amounts, sale));
    recoveries.forEach((recovery) => this.addRecovery(amounts, recovery));

    return this.closeAmounts(amounts);
  }

  // Ventile une vente : le théorique toujours, le réel pour le comptant et le crédit, l'offert à part.
  private addSale(amounts: DashboardAmounts, sale: Sale) {
    // Le théorique garde le brut de toutes les ventes actives, offerts compris.
    addMoneyAmount(
      amounts.theoreticalAmounts,
      sale.currency,
      sale.theoreticalAmount,
    );

    // Un offert est isolé avant remise et n'entre jamais dans le chiffre d'affaires réel.
    if (sale.paymentType === SalePaymentType.OFFERED) {
      addMoneyAmount(
        amounts.offeredAmounts,
        sale.currency,
        sale.theoreticalAmount,
      );
      return;
    }

    addMoneyAmount(amounts.discountAmounts, sale.currency, sale.discountAmount);
    addMoneyAmount(amounts.realAmounts, sale.currency, sale.totalAmount);

    // Le comptant entre en caisse tout de suite.
    if (sale.paymentType === SalePaymentType.CASH) {
      addMoneyAmount(amounts.cashAmounts, sale.currency, sale.totalAmount);
      return;
    }

    // Un crédit compte avec ce qu'il en reste à payer aujourd'hui.
    addMoneyAmount(amounts.creditAmounts, sale.currency, sale.totalAmount);
    addMoneyAmount(
      amounts.remainingDebtAmounts,
      sale.currency,
      this.debtsService.summarize(sale).remainingAmount,
    );
  }

  // Un recouvrement reste dans sa devise d'origine.
  private addRecovery(amounts: DashboardAmounts, recovery: SaleRecovery) {
    addMoneyAmount(amounts.recoveryAmounts, recovery.currency, recovery.amount);
  }

  // L'encaissement se déduit une fois tout ajouté : comptant et recouvrements.
  private closeAmounts<T extends DashboardAmounts>(amounts: T) {
    amounts.collectionAmounts = normalizeMoneyMap(
      sumMoneyMaps(amounts.cashAmounts, amounts.recoveryAmounts),
    );

    return amounts;
  }

  // Nombre de ventes d'un type de paiement.
  private countByType(sales: Sale[], paymentType: SalePaymentType) {
    return sales.filter((sale) => sale.paymentType === paymentType).length;
  }
}
