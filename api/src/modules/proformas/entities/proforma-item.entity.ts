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
import { DecimalColumn } from '../../../common/database/decimal-column.decorator.js';
import { ProductService } from '../../catalog/product-services/entities/product-service.entity.js';
import { Proforma } from './proforma.entity.js';

// Une ligne garde sa désignation et le prix appliqué au moment de l'émission.
@Entity('proforma_items')
@Index('proforma_items_proforma_id_index', ['proformaId'])
export class ProformaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proforma_id', type: 'uuid' })
  proformaId: string;

  @ManyToOne(() => Proforma, (proforma) => proforma.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'proforma_id' })
  proforma: Relation<Proforma>;

  @Column({ name: 'product_service_id', type: 'uuid' })
  productServiceId: string;

  @ManyToOne(() => ProductService)
  @JoinColumn({ name: 'product_service_id' })
  productService: Relation<ProductService>;

  // Rang de la ligne sur le document (colonne N°).
  @Column({ type: 'integer' })
  position: number;

  @Column({ type: 'varchar', length: 255 })
  designation: string;

  @DecimalColumn()
  quantity: number;

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
