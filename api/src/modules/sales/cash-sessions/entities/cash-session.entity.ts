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
import type { MoneyMap } from '../../../../common/types/money-map.type.js';
import { User } from '../../../users/entities/user.entity.js';
import { CashSessionStatus } from '../enums/cash-session-status.enum.js';

@Entity('cash_sessions')
@Index('cash_sessions_user_id_index', ['userId'])
@Index('cash_sessions_opened_at_index', ['openedAt'])
// Index unique partiel cash_sessions_one_open_per_user (une session OPEN par utilisateur) : déclaré en migration, TypeORM ne sait pas l'exprimer
export class CashSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Le vendeur à qui appartient la caisse.
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'text' })
  status: CashSessionStatus;

  @Column({ name: 'opened_at', type: 'timestamp with time zone' })
  openedAt: Date;

  @Column({
    name: 'closed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  closedAt: Date | null;

  // Montants attendus, comptés et écarts, par devise, figés à la clôture.
  @Column({ name: 'system_amounts', type: 'jsonb', nullable: true })
  systemAmounts: MoneyMap | null;

  @Column({ name: 'closing_amounts', type: 'jsonb', nullable: true })
  closingAmounts: MoneyMap | null;

  @Column({ name: 'difference_amounts', type: 'jsonb', nullable: true })
  differenceAmounts: MoneyMap | null;

  // Remarque du vendeur à la clôture, par exemple pour expliquer un écart.
  @Column({ name: 'closing_note', type: 'text', nullable: true })
  closingNote: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date | null;
}
