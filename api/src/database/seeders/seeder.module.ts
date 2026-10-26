import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from '../../modules/catalog/product-categories/entities/product-category.entity.js';
import { ProductService } from '../../modules/catalog/product-services/entities/product-service.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';
import { AdminSeeder } from './admin.seeder.js';
import { CatalogSeeder } from './catalog.seeder.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, ProductCategory, ProductService])],
  providers: [AdminSeeder, CatalogSeeder],
})
export class SeederModule {}
