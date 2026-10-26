import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DecimalColumn } from '../../../common/database/decimal-column.decorator.js';

// Chaque changement de taux crée une ligne : le plus récent fait foi.
@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @DecimalColumn({ name: 'exchange_rate' })
  exchangeRate: number;

  @DecimalColumn({ name: 'sell_rate' })
  sellRate: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
