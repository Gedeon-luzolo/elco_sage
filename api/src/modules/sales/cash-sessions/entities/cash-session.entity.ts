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
import type { MoneyMap } from '../../../../common/types/money-map.type.js';
import { User } from '../../../users/entities/user.entity.js';
import { CashSessionStatus } from '../enums/cash-session-status.enum.js';

@Entity('cash_sessions')
export class CashSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'opened_by_id', type: 'uuid' })
  openedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by_id' })
  openedBy: Relation<User>;

  @Column({ name: 'closed_by_id', type: 'uuid', nullable: true })
  closedById: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by_id' })
  closedBy: Relation<User> | null;

  @Column({ type: 'text' })
  status: CashSessionStatus;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  // Montants attendus, comptés et écarts, par devise, figés à la clôture.
  @Column({ name: 'system_amounts', type: 'jsonb', nullable: true })
  systemAmounts: MoneyMap | null;

  @Column({ name: 'closing_amounts', type: 'jsonb', nullable: true })
  closingAmounts: MoneyMap | null;

  @Column({ name: 'difference_amounts', type: 'jsonb', nullable: true })
  differenceAmounts: MoneyMap | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
