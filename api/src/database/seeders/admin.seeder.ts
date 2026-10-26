import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity.js';
import { UserRole, UserStatus } from '../../modules/users/enums/user.enums.js';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Compte du premier accès après migration.
  private readonly admin = {
    fullName: 'Administrateur Elco Sage',
    email: 'admin@gmail.com',
    password: '12345678',
  } as const;

  /**
   * Crée le compte administrateur s'il n'existe pas déjà (idempotent).
   * Un compte existant n'est jamais modifié : son mot de passe a pu être changé.
   */
  async seed() {
    const existing = await this.usersRepository.findOne({
      where: { email: this.admin.email },
    });

    if (existing) {
      this.logger.log(`Le compte "${this.admin.email}" existe déjà.`);
      return existing;
    }

    const admin = await this.usersRepository.save(
      this.usersRepository.create({
        fullName: this.admin.fullName,
        email: this.admin.email,
        password: await bcrypt.hash(this.admin.password, 10),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        failedLoginAttempts: 0,
      }),
    );
    this.logger.log(`Compte "${this.admin.email}" créé.`);

    return admin;
  }
}
