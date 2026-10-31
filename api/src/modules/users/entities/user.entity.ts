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
@Unique('users_seller_code_unique', ['sellerCode'])
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

  // Attribuée à la première vente préparée hors ligne : elle ouvre ses références (A0009).
  @Column({ name: 'seller_code', type: 'varchar', length: 2, nullable: true })
  sellerCode: string | null;

  // Jamais lu par défaut non plus : seule la connexion en a besoin.
  @Column({ name: 'failed_login_attempts', type: 'integer', select: false })
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
