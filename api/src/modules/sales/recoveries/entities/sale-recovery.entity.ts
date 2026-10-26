import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { DecimalColumn } from '../../../../common/database/decimal-column.decorator.js';
import { Currency } from '../../../../common/enums/currency.enum.js';
import { PaymentMethod } from '../../../../common/enums/payment-method.enum.js';
import { User } from '../../../users/entities/user.entity.js';
import { CashSession } from '../../cash-sessions/entities/cash-session.entity.js';
import { Sale } from '../../sales/entities/sale.entity.js';

// Paiement reçu sur une vente à crédit.
@Entity('sale_recoveries')
export class SaleRecovery {
  // L'id peut venir du client hors ligne : il rend l'envoi rejouable sans doublon.
  @PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId: string;

  @ManyToOne(() => Sale, (sale) => sale.recoveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Relation<Sale>;

  @Column({ name: 'cash_session_id', type: 'uuid', nullable: true })
  cashSessionId: string | null;

  @ManyToOne(() => CashSession, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cash_session_id' })
  cashSession: Relation<CashSession> | null;

  @Column({ name: 'received_by_id', type: 'uuid' })
  receivedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by_id' })
  receivedBy: Relation<User>;

  @DecimalColumn()
  amount: number;

  @Column({ type: 'text' })
  currency: Currency;

  @Column({ name: 'payment_method', type: 'text' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_reference', type: 'varchar', nullable: true })
  paymentReference: string | null;

  @Column({ name: 'recovered_at', type: 'timestamptz' })
  recoveredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
