import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PeriodDto } from '../../../common/dto/period.dto.js';
import { UuidParam } from '../../../common/decorators/uuid-param.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import type { User } from '../../users/entities/user.entity.js';
import { CreateSaleRecoveryDto } from './dto/create-sale-recovery.dto.js';
import { RecoveriesService } from './recoveries.service.js';

// Recouvrements : tout utilisateur connecté encaisse un paiement de dette.
@Controller()
@UseGuards(AuthGuard)
export class RecoveriesController {
  constructor(private readonly recoveriesService: RecoveriesService) {}

  /**
   * Historique des paiements de dettes sur la période.
   */
  @Get('recoveries')
  findHistory(@Query() query: PeriodDto) {
    return this.recoveriesService.getHistory(query);
  }

  /**
   * Enregistre un paiement sur une vente à crédit. Rejouable si l'id est fourni.
   */
  @Post('sales/:saleId/recoveries')
  create(
    @CurrentUser() actor: User,
    @UuidParam('saleId') saleId: string,
    @Body() dto: CreateSaleRecoveryDto,
  ) {
    return this.recoveriesService.create(actor, saleId, dto);
  }
}
