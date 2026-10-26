import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../../../common/enums/currency.enum.js';
import {
  normalizeMoneyMap,
  sumMoneyByCurrency,
  sumMoneyMaps,
} from '../../../common/utils/money-map.utils.js';
import { SaleRecovery } from '../recoveries/entities/sale-recovery.entity.js';
import type { Sale } from '../sales/entities/sale.entity.js';
import { SalePaymentType, SaleStatus } from '../sales/enums/sale.enums.js';
import { SalesService } from '../sales/sales.service.js';
import { CashSessionsService } from './cash-sessions.service.js';

type CurrencyTotalRow = { currency: Currency; total: string };

@Injectable()
export class CashSessionReportService {
  constructor(
    @InjectRepository(SaleRecovery)
    private readonly recoveriesRepository: Repository<SaleRecovery>,
    private readonly cashSessionsService: CashSessionsService,
    private readonly salesService: SalesService,
  ) {}

  /**
   * Rapport d'une session : son en-tête, ses ventes actives et ses totaux par devise.
   */
  async getReport(cashSessionId: string) {
    const session = await this.cashSessionsService.findOneOrFail(cashSessionId);

    // Les ventes valides de la session, dans l'ordre où elles ont été faites.
    const sales = await this.salesService
      .detailedQuery()
      .where('sale.cash_session_id = :cashSessionId', { cashSessionId })
      .andWhere('sale.status = :active', { active: SaleStatus.ACTIVE })
      .orderBy('sale.saleDate', 'ASC')
      .addOrderBy('recovery.recoveredAt', 'DESC')
      .getMany();

    // Les recouvrements comptés sont ceux encaissés pendant la session, comme à la clôture,
    // même quand la dette vient d'une vente d'une autre session.
    const recoveryAmounts = await this.sumSessionRecoveries(cashSessionId);

    return { session, sales, totals: this.buildTotals(sales, recoveryAmounts) };
  }

  // Encaissements de dettes de la session, par devise.
  private async sumSessionRecoveries(cashSessionId: string) {
    const rows = await this.recoveriesRepository.query<CurrencyTotalRow[]>(
      `SELECT currency, SUM(amount) AS total
       FROM sale_recoveries
       WHERE cash_session_id = $1
       GROUP BY currency`,
      [cashSessionId],
    );

    // PostgreSQL renvoie les sommes en texte.
    return Object.fromEntries(
      rows.map((row) => [row.currency, Number(row.total)]),
    );
  }

  // Indicateurs financiers du rapport, par devise et sans conversion.
  private buildTotals(sales: Sale[], recoveryAmounts: Record<string, number>) {
    // Les ventes payées tout de suite et les crédits ne nourrissent pas les mêmes indicateurs.
    const cashSales = sales.filter(
      (sale) => sale.paymentType === SalePaymentType.CASH,
    );
    const debtSales = sales.filter(
      (sale) => sale.paymentType === SalePaymentType.CREDIT,
    );

    const cashAmounts = sumMoneyByCurrency(
      cashSales,
      (sale) => sale.currency,
      (sale) => sale.totalAmount,
    );
    const debtAmounts = sumMoneyByCurrency(
      debtSales,
      (sale) => sale.currency,
      (sale) => sale.totalAmount,
    );

    return {
      theoreticalAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          sales,
          (sale) => sale.currency,
          (sale) => sale.theoreticalAmount,
        ),
      ),
      discountAmounts: normalizeMoneyMap(
        sumMoneyByCurrency(
          sales,
          (sale) => sale.currency,
          (sale) => sale.discountAmount,
        ),
      ),
      cashAmounts: normalizeMoneyMap(cashAmounts),
      debtAmounts: normalizeMoneyMap(debtAmounts),
      // Le réel : ce que la session a vendu, comptant et crédit confondus.
      realAmounts: normalizeMoneyMap(sumMoneyMaps(cashAmounts, debtAmounts)),
      recoveryAmounts: normalizeMoneyMap(recoveryAmounts),
      // L'encaissement : l'argent réellement entré en caisse, comptant et recouvrements.
      collectionAmounts: normalizeMoneyMap(
        sumMoneyMaps(cashAmounts, recoveryAmounts),
      ),
    };
  }
}
