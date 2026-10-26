import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  CacheInvalidate,
  Cacheable,
} from '../../common/cache/decorators/cache.decorators.js';
import { CacheTtl } from '../../common/cache/enum/cache-ttl.enum.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { ManagementGuard } from '../auth/guards/management.guard.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto.js';
import { ExchangeRatesService } from './exchange-rates.service.js';

@Controller('exchange-rates')
@UseGuards(AuthGuard)
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  /**
   * Historique des taux : le premier est le taux courant.
   */
  @Get()
  @Cacheable({ key: 'exchange_rates:history:{0}', ttl: CacheTtl.ONE_MONTH })
  findAll(@Query('limit') limit?: string) {
    // 20 lignes par défaut ; une valeur illisible retombe sur ce défaut.
    const parsed = Number(limit);

    return this.exchangeRatesService.getHistory(
      Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 20,
    );
  }

  /**
   * Ajoute un taux (direction uniquement).
   */
  @Post()
  @HttpCode(204)
  @CacheInvalidate({ patterns: ['exchange_rates:', 'product_services:'] })
  @UseGuards(ManagementGuard)
  async create(
    @CurrentUser() actor: User,
    @Body() createExchangeRateDto: CreateExchangeRateDto,
  ) {
    await this.exchangeRatesService.create(actor, createExchangeRateDto);
  }
}
