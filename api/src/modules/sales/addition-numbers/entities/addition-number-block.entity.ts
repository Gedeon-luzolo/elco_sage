import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Plage de numéros réservée à un utilisateur : le client hors ligne n'émet que ceux-là.
@Entity('addition_number_blocks')
@Index('addition_number_blocks_cash_session_id_user_id_index', [
  'cashSessionId',
  'userId',
]) // Plages d'un utilisateur dans une session
export class AdditionNumberBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cash_session_id', type: 'uuid' })
  cashSessionId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'start_number', type: 'integer' })
  startNumber: number;

  @Column({ name: 'end_number', type: 'integer' })
  endNumber: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
