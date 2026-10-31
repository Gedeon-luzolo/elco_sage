import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DecimalColumn } from '../../../common/database/decimal-column.decorator.js';
import { Currency } from '../../../common/enums/currency.enum.js';
import { Customer } from '../../customers/entities/customer.entity.js';
import { Sale } from '../../sales/sales/entities/sale.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ProformaStatus } from '../utils/proforma.utils.js';
import { ProformaItem } from './proforma-item.entity.js';

@Entity('proformas')
@Index('proformas_issued_at_index', ['issuedAt']) // Liste par date d'émission
export class Proforma {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Numéro dans le mois d'émission : il repart à 1 chaque mois (unicité par index en migration).
  @Column({ type: 'integer' })
  number: number;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer>;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: Relation<User>;

  @Column({ name: 'sale_id', type: 'uuid', nullable: true })
  saleId: string | null;

  @ManyToOne(() => Sale, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sale_id' })
  sale: Relation<Sale> | null;

  // Date du document : imprimée, et mois du numéro. created_at reste la date technique.
  @Column({ name: 'issued_at', type: 'timestamp with time zone' })
  issuedAt: Date;

  @Column({ type: 'text' })
  currency: Currency;

  @DecimalColumn({ name: 'theoretical_amount' })
  theoreticalAmount: number;

  @DecimalColumn({ name: 'discount_amount' })
  discountAmount: number;

  @DecimalColumn({ name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'text' })
  status: ProformaStatus;

  @OneToMany(() => ProformaItem, (item) => item.proforma)
  items: Relation<ProformaItem[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date | null;
}
