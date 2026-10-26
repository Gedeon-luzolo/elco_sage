import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module.js';
import { ProductCategory } from './product-categories/entities/product-category.entity.js';
import { ProductCategoriesController } from './product-categories/product-categories.controller.js';
import { ProductCategoriesService } from './product-categories/product-categories.service.js';
import { ProductService } from './product-services/entities/product-service.entity.js';
import { ProductServicesController } from './product-services/product-services.controller.js';
import { ProductServicesService } from './product-services/product-services.service.js';

// Catalogue : catégories, produits en stock et services vendables.
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductCategory, ProductService]),
    ExchangeRatesModule,
  ],
  controllers: [ProductCategoriesController, ProductServicesController],
  providers: [ProductCategoriesService, ProductServicesService],
  exports: [ProductServicesService],
})
export class CatalogModule {}
