import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DecimalColumn } from '../../../../common/database/decimal-column.decorator.js';
import { Currency } from '../../../../common/enums/currency.enum.js';
import { PaymentMethod } from '../../../../common/enums/payment-method.enum.js';
import { Customer } from '../../../customers/entities/customer.entity.js';
import { User } from '../../../users/entities/user.entity.js';
import { CashSession } from '../../cash-sessions/entities/cash-session.entity.js';
import { SaleRecovery } from '../../recoveries/entities/sale-recovery.entity.js';
import { SalePaymentType, SaleStatus } from '../enums/sale.enums.js';
import { SaleItem } from './sale-item.entity.js';

@Entity('sales')
@Unique('sales_addition_number_unique', ['additionNumber'])
@Index('sales_cash_session_id_sale_date_index', ['cashSessionId', 'saleDate']) // Ventes d'une session, dans l'ordre
@Index('sales_sale_date_index', ['saleDate']) // Historique et pilotage par période
export class Sale {
  // L'id peut venir du client hors ligne : il rend la création rejouable sans doublon.
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'cash_session_id', type: 'uuid' })
  cashSessionId: string;

  @ManyToOne(() => CashSession)
  @JoinColumn({ name: 'cash_session_id' })
  cashSession: Relation<CashSession>;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Relation<Customer> | null;

  @Column({ name: 'operator_id', type: 'uuid' })
  operatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: Relation<User>;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: Relation<User>;

  @Column({ name: 'payment_type', type: 'text' })
  paymentType: SalePaymentType;

  // Renseignés pour une vente payée tout de suite ; vides pour un crédit ou un offert.
  @Column({ name: 'payment_method', type: 'text', nullable: true })
  paymentMethod: PaymentMethod | null;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentReference: string | null;

  @Column({ name: 'addition_number', type: 'varchar', length: 6 })
  additionNumber: string;

  @Column({ name: 'sale_date', type: 'timestamp with time zone' })
  saleDate: Date;

  @Column({ type: 'text' })
  currency: Currency;

  @DecimalColumn({ name: 'theoretical_amount' })
  theoreticalAmount: number;

  @DecimalColumn({ name: 'discount_amount' })
  discountAmount: number;

  @DecimalColumn({ name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'text' })
  status: SaleStatus;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: Relation<SaleItem[]>;

  @OneToMany(() => SaleRecovery, (recovery) => recovery.sale)
  recoveries: Relation<SaleRecovery[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date | null;
}
