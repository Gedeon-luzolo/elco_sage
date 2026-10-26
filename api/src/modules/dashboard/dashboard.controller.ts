import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PeriodDto } from '../../common/dto/period.dto.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { ManagementGuard } from '../auth/guards/management.guard.js';
import { DashboardService } from './dashboard.service.js';

// Pilotage : réservé à la direction.
@Controller('dashboard')
@UseGuards(AuthGuard, ManagementGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Vue d'ensemble sur la période demandée ; sans dates, le mois en cours.
   */
  @Get()
  getOverview(@Query() query: PeriodDto) {
    return this.dashboardService.getOverview(query);
  }
}
