import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UuidParam } from '../../../common/decorators/uuid-param.decorator.js';
import {
  CacheInvalidate,
  Cacheable,
} from '../../../common/cache/decorators/cache.decorators.js';
import { CacheTtl } from '../../../common/cache/enum/cache-ttl.enum.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { ManagementGuard } from '../../auth/guards/management.guard.js';
import type { User } from '../../users/entities/user.entity.js';
import { ProductCategoriesService } from '../product-categories/product-categories.service.js';
import {
  CreateProductServiceDto,
  UpdateProductServiceDto,
} from './dto/create-update-product-service.dto.js';
import { ProductServicesService } from './product-services.service.js';

@Controller('product-services')
@UseGuards(AuthGuard)
export class ProductServicesController {
  constructor(
    private readonly productServicesService: ProductServicesService,
    private readonly categoriesService: ProductCategoriesService,
  ) {}

  /**
   * Services vendables (donnée de référence hors ligne de la caisse).
   */
  @Get('active-for-sale')
  @Cacheable({
    key: 'product_services:active_for_sale',
    ttl: CacheTtl.ONE_MONTH,
  })
  findActiveForSale() {
    return this.productServicesService.getActiveServicesForSale();
  }

  /**
   * Catalogue complet et catégories actives pour l'écran d'administration.
   */
  @Get()
  @UseGuards(ManagementGuard)
  @Cacheable({ key: 'product_services:overview', ttl: CacheTtl.ONE_MONTH })
  async findAll() {
    // Le formulaire a besoin des catégories actives en plus du catalogue.
    const overview = await this.productServicesService.getOverview();
    const categories = await this.categoriesService.getActive();

    return { ...overview, categories };
  }

  /**
   * Crée un produit ou un service.
   */
  @Post()
  @UseGuards(ManagementGuard)
  @CacheInvalidate({ patterns: ['product_services:'] })
  create(@CurrentUser() actor: User, @Body() dto: CreateProductServiceDto) {
    return this.productServicesService.create(actor, dto);
  }

  /**
   * Modifie un produit ou un service.
   */
  @Patch(':id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  @CacheInvalidate({ patterns: ['product_services:'] })
  async update(
    @CurrentUser() actor: User,
    @UuidParam() id: string,
    @Body() dto: UpdateProductServiceDto,
  ) {
    await this.productServicesService.update(actor, id, dto);
  }
}
