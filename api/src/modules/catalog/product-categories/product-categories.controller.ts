import {
  Body,
  Controller,
  Delete,
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
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/create-update-product-category.dto.js';
import { ProductCategoriesService } from './product-categories.service.js';

// Back-office du catalogue : réservé à la direction.
@Controller('product-categories')
@UseGuards(AuthGuard, ManagementGuard)
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  /**
   * Catégories avec leurs statistiques.
   */
  @Get()
  @Cacheable({ key: 'product_categories:overview', ttl: CacheTtl.ONE_MONTH })
  findAll() {
    return this.categoriesService.getOverview();
  }

  /**
   * Crée une catégorie.
   */
  @Post()
  @CacheInvalidate({ patterns: ['product_categories:', 'product_services:'] })
  create(@CurrentUser() actor: User, @Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.create(actor, dto);
  }

  /**
   * Modifie une catégorie (nom et statut).
   */
  @Patch(':id')
  @HttpCode(204)
  @CacheInvalidate({ patterns: ['product_categories:', 'product_services:'] })
  async update(
    @CurrentUser() actor: User,
    @UuidParam() id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    await this.categoriesService.update(actor, id, dto);
  }

  /**
   * Supprime une catégorie vide.
   */
  @Delete(':id')
  @HttpCode(204)
  @CacheInvalidate({ patterns: ['product_categories:', 'product_services:'] })
  async delete(@CurrentUser() actor: User, @UuidParam() id: string) {
    await this.categoriesService.delete(actor, id);
  }
}
