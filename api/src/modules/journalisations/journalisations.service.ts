import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { User } from '../users/entities/user.entity.js';
import { Journalisation } from './entities/journalisation.entity.js';
import type { JournalisationModule } from './enums/journalisation-module.enum.js';

@Injectable()
export class JournalisationsService {
  constructor(
    @InjectRepository(Journalisation)
    private readonly journalisationsRepository: Repository<Journalisation>,
  ) {}

  /**
   * Ajoute une ligne au journal d'audit.
   * L'utilisateur reste optionnel pour journaliser aussi les actions système.
   */
  async create(
    module: JournalisationModule,
    message: string,
    user?: Pick<User, 'id'> | null,
  ) {
    return this.journalisationsRepository.save(
      this.journalisationsRepository.create({
        module,
        message,
        userId: user?.id ?? null,
      }),
    );
  }
}
