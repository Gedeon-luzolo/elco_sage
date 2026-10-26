import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DecimalColumn } from '../../../../common/database/decimal-column.decorator.js';
import { ProductCategory } from '../../product-categories/entities/product-category.entity.js';
import { ProductServiceType } from '../enums/product-service-type.enum.js';

@Entity('product_services')
export class ProductService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => ProductCategory)
  @JoinColumn({ name: 'category_id' })
  category: Relation<ProductCategory> | null;

  @Column({ type: 'varchar' })
  type: ProductServiceType;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'is_active', type: 'boolean' })
  isActive: boolean;

  // Produit en stock consommé par un service (ex : le papier d'une impression).
  @Column({ name: 'stock_product_id', type: 'uuid', nullable: true })
  stockProductId: string | null;

  @ManyToOne(() => ProductService, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stock_product_id' })
  stockProduct: Relation<ProductService> | null;

  // Unité de vente ou de consommation (ex : feuille).
  @Column({ name: 'base_unit', type: 'varchar', nullable: true })
  baseUnit: string | null;

  // Unité de conditionnement (ex : rame), uniquement pour un produit.
  @Column({ name: 'packaging_unit', type: 'varchar', nullable: true })
  packagingUnit: string | null;

  // Nombre d'unités de base dans le conditionnement (ex : 500 feuilles par rame).
  @Column({ name: 'packaging_capacity', type: 'integer', nullable: true })
  packagingCapacity: number | null;

  @DecimalColumn({ name: 'price_usd' })
  priceUsd: number;

  @DecimalColumn({ name: 'price_cdf' })
  priceCdf: number;

  // Coût d'une unité de base : prix du conditionnement divisé par sa capacité.
  @DecimalColumn({ name: 'material_cost_usd' })
  materialCostUsd: number;

  @DecimalColumn({ name: 'material_cost_cdf' })
  materialCostCdf: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
