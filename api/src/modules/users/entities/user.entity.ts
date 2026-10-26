import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../enums/user.enums.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar' })
  email: string;

  // Jamais lu par défaut : seule la connexion le demande explicitement.
  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'text' })
  role: UserRole;

  @Column({ type: 'text' })
  status: UserStatus;

  @Column({ name: 'failed_login_attempts', type: 'integer' })
  failedLoginAttempts: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
