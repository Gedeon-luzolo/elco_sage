import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PeriodDto } from '../../common/dto/period.dto.js';
import { Currency } from '../../common/enums/currency.enum.js';
import {
  dayRange,
  eachDayKey,
  monthStartKey,
  todayKey,
  toDayLabel,
} from '../../common/utils/date.utils.js';
import { SaleRecovery } from '../sales/recoveries/entities/sale-recovery.entity.js';
import { Sale } from '../sales/sales/entities/sale.entity.js';
import { SaleStatus } from '../sales/sales/enums/sale.enums.js';
import { userSummaryFields } from '../users/utils/user.utils.js';
import { DashboardReportsService } from './services/dashboard-reports.service.js';

// Au-delà d'un an, le rapport journalier devient illisible et coûteux.
const MAX_PERIOD_DAYS = 366;

// Nombre de services affichés dans le classement.
const TOP_SERVICES_LIMIT = 15;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleRecovery)
    private readonly recoveriesRepository: Repository<SaleRecovery>,
    private readonly dashboardReportsService: DashboardReportsService,
  ) {}

  /**
   * Vue d'ensemble de la direction sur une période, montants séparés par devise.
   * Les données sont chargées une seule fois, puis tous les indicateurs en sont tirés en mémoire.
   */
  async getOverview(query: PeriodDto) {
    const period = this.resolvePeriod(query);
    const days = eachDayKey(period.startDate, period.endDate);

    // Une période inversée ou trop longue est refusée plutôt que de produire un rapport vide ou énorme.
    if (days.length === 0 || days.length > MAX_PERIOD_DAYS) {
      throw new UnprocessableEntityException(
        days.length === 0
          ? 'La date de début doit précéder la date de fin.'
          : `La période ne peut pas dépasser ${MAX_PERIOD_DAYS} jours.`,
      );
    }

    const { start, end } = dayRange(period.startDate, period.endDate);
    const sales = await this.findSales(start, end);
    const recoveries = await this.findRecoveries(start, end);

    const periodicReports = this.dashboardReportsService.buildPeriodicReports(
      days,
      sales,
      recoveries,
    );

    return {
      period,
      stats: this.dashboardReportsService.buildStats(sales, recoveries),
      periodicReports,
      // Le graphique d'évolution suit les mêmes jours que le rapport journalier.
      dailySales: periodicReports.map((report) => ({
        date: report.date,
        label: toDayLabel(report.date, false),
        cdf: report.realAmounts[Currency.CDF],
        usd: report.realAmounts[Currency.USD],
        count: report.additionsCount,
      })),
      paymentDistribution:
        this.dashboardReportsService.buildPaymentDistribution(sales),
      topServices: this.dashboardReportsService.buildTopServices(
        sales,
        TOP_SERVICES_LIMIT,
      ),
      staffProductivity: this.dashboardReportsService.buildStaffProductivity(
        sales,
        recoveries,
      ),
    };
  }

  // Sans dates, le mois en cours jusqu'à aujourd'hui.
  private resolvePeriod({ startDate, endDate }: PeriodDto) {
    const today = todayKey();

    return {
      startDate: startDate ?? monthStartKey(today),
      endDate: endDate ?? today,
    };
  }

  // Ventes actives de la période, avec juste ce que les calculs utilisent.
  private async findSales(start: Date, end: Date) {
    return (
      this.salesRepository
        .createQueryBuilder('sale')
        .leftJoin('sale.operator', 'operator')
        .leftJoin('sale.items', 'item')
        .leftJoin('item.productService', 'productService')
        // Tous les paiements de la vente, même hors période : ils donnent le reste dû aujourd'hui.
        .leftJoin('sale.recoveries', 'recovery')
        .addSelect([
          ...userSummaryFields('operator'),
          'item.id',
          'item.productServiceId',
          'item.quantity',
          'item.currency',
          'item.totalPrice',
          'productService.id',
          'productService.name',
          'recovery.id',
          'recovery.currency',
          'recovery.amount',
        ])
        // Les ventes annulées ne comptent dans aucun indicateur.
        .where('sale.status = :active', { active: SaleStatus.ACTIVE })
        .andWhere('sale.sale_date BETWEEN :start AND :end', { start, end })
        .getMany()
    );
  }

  // Paiements reçus pendant la période, quelle que soit la date de la vente.
  private async findRecoveries(start: Date, end: Date) {
    return this.recoveriesRepository
      .createQueryBuilder('recovery')
      .leftJoin('recovery.receivedBy', 'receivedBy')
      .addSelect(userSummaryFields('receivedBy'))
      .where('recovery.recovered_at BETWEEN :start AND :end', { start, end })
      .getMany();
  }
}
