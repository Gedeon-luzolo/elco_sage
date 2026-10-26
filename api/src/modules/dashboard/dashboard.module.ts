import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleRecovery } from '../sales/recoveries/entities/sale-recovery.entity.js';
import { Sale } from '../sales/sales/entities/sale.entity.js';
import { SalesModule } from '../sales/sales.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardReportsService } from './services/dashboard-reports.service.js';

// Pilotage : indicateurs, rapport journalier, classement des services et productivité.
@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleRecovery]), SalesModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardReportsService],
})
export class DashboardModule {}
