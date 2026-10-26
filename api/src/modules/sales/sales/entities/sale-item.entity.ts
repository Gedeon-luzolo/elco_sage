import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DecimalColumn } from '../../../../common/database/decimal-column.decorator.js';
import { Currency } from '../../../../common/enums/currency.enum.js';
import { ProductService } from '../../../catalog/product-services/entities/product-service.entity.js';
import { Sale } from './sale.entity.js';

// Une ligne garde le prix appliqué au moment de la vente.
@Entity('sale_items')
@Index('sale_items_sale_id_index', ['saleId'])
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Relation<Sale>;

  @Column({ name: 'product_service_id', type: 'uuid' })
  productServiceId: string;

  @ManyToOne(() => ProductService)
  @JoinColumn({ name: 'product_service_id' })
  productService: Relation<ProductService>;

  @DecimalColumn()
  quantity: number;

  @Column({ type: 'text' })
  currency: Currency;

  @DecimalColumn({ name: 'unit_price' })
  unitPrice: number;

  @DecimalColumn({ name: 'total_price' })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date | null;
}
