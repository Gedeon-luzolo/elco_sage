import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UuidParam } from '../../../common/decorators/uuid-param.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { ManagementGuard } from '../../auth/guards/management.guard.js';
import type { User } from '../../users/entities/user.entity.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { FindSalesDto } from './dto/find-sales.dto.js';
import { SalesService } from './sales.service.js';

@Controller('sales')
@UseGuards(AuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Historique des ventes (toutes caisses), filtrable par date, numéro et statut.
   */
  @Get()
  findHistory(@Query() query: FindSalesDto) {
    return this.salesService.findHistory(query);
  }

  /**
   * Crée une vente. Rejouable si l'id est fourni (vente faite hors ligne).
   */
  @Post()
  create(@CurrentUser() actor: User, @Body() dto: CreateSaleDto) {
    return this.salesService.create(actor, dto);
  }

  /**
   * Annule une vente : réservé à la direction.
   */
  @Patch(':id/cancel')
  @UseGuards(ManagementGuard)
  cancel(@CurrentUser() actor: User, @UuidParam() id: string) {
    return this.salesService.cancel(actor, id);
  }
}
