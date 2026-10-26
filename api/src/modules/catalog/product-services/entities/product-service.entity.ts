import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DecimalColumn } from '../../../../common/database/decimal-column.decorator.js';
import { ProductCategory } from '../../product-categories/entities/product-category.entity.js';
import { ProductServiceType } from '../enums/product-service-type.enum.js';

@Entity('product_services')
@Unique('product_services_name_unique', ['name'])
@Index('product_services_stock_product_id_index', ['stockProductId'])
export class ProductService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => ProductCategory)
  @JoinColumn({ name: 'category_id' })
  category: Relation<ProductCategory> | null;

  @Column({ type: 'varchar', length: 255 })
  type: ProductServiceType;

  @Column({ type: 'varchar', length: 255 })
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
  @Column({ name: 'base_unit', type: 'varchar', length: 255, nullable: true })
  baseUnit: string | null;

  // Unité de conditionnement (ex : rame), uniquement pour un produit.
  @Column({
    name: 'packaging_unit',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date | null;
}
