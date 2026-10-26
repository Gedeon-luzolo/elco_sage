import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../enums/user.enums.js';

@Entity('users')
@Unique('users_email_unique', ['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  // Jamais lu par défaut : seule la connexion le demande explicitement.
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'text' })
  role: UserRole;

  @Column({ type: 'text' })
  status: UserStatus;

  @Column({ name: 'failed_login_attempts', type: 'integer' })
  failedLoginAttempts: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  updatedAt: Date | null;
}
