import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { dayRange } from '../../common/utils/date.utils.js';
import { paginateBatch } from '../../common/utils/pagination.utils.js';
import type { User } from '../users/entities/user.entity.js';
import type { FindJournalisationsDto } from './dto/find-journalisations.dto.js';
import { Journalisation } from './entities/journalisation.entity.js';
import type { JournalisationModule } from './enums/journalisation-module.enum.js';

// Nombre maximum d'entrées renvoyées par lot.
const JOURNALISATIONS_MAX_BATCH = 50;

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
    // Sans utilisateur, la ligne reste attribuée au système.
    return this.journalisationsRepository.save(
      this.journalisationsRepository.create({
        module,
        message,
        userId: user?.id ?? null,
      }),
    );
  }

  /**
   * Entrées du journal par lot, de la plus récente à la plus ancienne, avec le total filtré.
   */
  async findBatch({
    offset,
    limit,
    module,
    startDate,
    endDate,
  }: FindJournalisationsDto) {
    // L'auteur de chaque entrée est réduit à son nom.
    const query = this.journalisationsRepository
      .createQueryBuilder('entry')
      .leftJoin('entry.user', 'user')
      .addSelect(['user.id', 'user.fullName'])
      .orderBy('entry.createdAt', 'DESC');

    if (module) {
      query.andWhere('entry.module = :module', { module });
    }

    // La période couvre des journées complètes à Kinshasa.
    if (startDate && endDate) {
      const { start, end } = dayRange(startDate, endDate);
      query.andWhere('entry.created_at BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    return paginateBatch(query, {
      offset,
      limit,
      maxLimit: JOURNALISATIONS_MAX_BATCH,
    });
  }
}
