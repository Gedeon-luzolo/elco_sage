import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UuidParam } from '../../common/decorators/uuid-param.decorator.js';
import {
  CacheInvalidate,
  Cacheable,
} from '../../common/cache/decorators/cache.decorators.js';
import { CacheTtl } from '../../common/cache/enum/cache-ttl.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { User } from '../users/entities/user.entity.js';
import { CustomersService } from './customers.service.js';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/create-update-customer.dto.js';

// Les clients sont gérés par toute l'équipe, pas seulement par la direction.
@Controller('customers')
@UseGuards(AuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Clients avec leurs statistiques.
   */
  @Get()
  @Cacheable({ key: 'customers:overview', ttl: CacheTtl.ONE_MONTH })
  findAll() {
    return this.customersService.getOverview();
  }

  /**
   * Clients actifs (donnée de référence hors ligne de la caisse).
   */
  @Get('active-for-sale')
  @Cacheable({ key: 'customers:active_for_sale', ttl: CacheTtl.ONE_MONTH })
  findActiveForSale() {
    return this.customersService.getActiveCustomersForSale();
  }

  /**
   * Crée un client.
   */
  @Post()
  @CacheInvalidate({ patterns: ['customers:'] })
  create(@CurrentUser() actor: User, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(actor, dto);
  }

  /**
   * Modifie un client (informations et statut).
   */
  @Patch(':id')
  @HttpCode(204)
  @CacheInvalidate({ patterns: ['customers:'] })
  async update(
    @CurrentUser() actor: User,
    @UuidParam() id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    await this.customersService.update(actor, id, dto);
  }
}
