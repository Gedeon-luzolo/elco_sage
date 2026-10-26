import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { AdditionNumberBlock } from './entities/addition-number-block.entity.js';

// Taille d'une plage réservée à un utilisateur pour vendre hors ligne.
const BLOCK_SIZE = 100;

// La colonne addition_number est limitée à 6 caractères.
const MAX_ADDITION_NUMBER = 9999;

// Verrou qui sérialise toute attribution de numéro (vente ou réservation de plage), libéré à la fin de la transaction.
const ADDITION_NUMBER_LOCK = `SELECT pg_advisory_xact_lock(hashtext('sales_addition_number'))`;

type LastUsedRow = { last: number | null };
type NextNumberRow = { next_number: number };

@Injectable()
export class AdditionNumbersService {
  constructor(
    @InjectRepository(AdditionNumberBlock)
    private readonly blocksRepository: Repository<AdditionNumberBlock>,
  ) {}

  /**
   * Formate un numéro d'addition (ex : 42 => "00042").
   */
  format(value: number) {
    return String(value).padStart(5, '0');
  }

  /**
   * Prend le verrou de numérotation. N'a d'effet qu'à l'intérieur d'une transaction.
   */
  async lock() {
    // Deux attributions simultanées ne peuvent pas lire le même « prochain numéro ».
    await this.blocksRepository.query(ADDITION_NUMBER_LOCK);
  }

  /**
   * Numéro attribué par le serveur à une vente envoyée sans numéro.
   */
  @Transactional()
  async generateOnlineNumber() {
    // Le verrou est tenu jusqu'à la fin de la transaction de la vente.
    await this.lock();

    return this.format(await this.nextFreeNumber());
  }

  /**
   * Réserve une nouvelle plage de numéros à un utilisateur pour une session de caisse.
   */
  @Transactional()
  async reserveBlock(cashSessionId: string, userId: string, size = BLOCK_SIZE) {
    await this.lock();

    // La plage commence juste après tout ce qui est déjà vendu ou réservé.
    const startNumber = await this.nextFreeNumber();
    const endNumber = startNumber + size - 1;

    // La numérotation tient sur 6 chiffres : au-delà, plus aucune réservation possible.
    if (endNumber > MAX_ADDITION_NUMBER) {
      throw new UnprocessableEntityException(
        "La numérotation des additions est épuisée, contactez l'administrateur.",
      );
    }

    await this.blocksRepository.insert({
      cashSessionId,
      userId,
      startNumber,
      endNumber,
    });

    return { startNumber, endNumber };
  }

  /**
   * Plages réservées à l'utilisateur dans la session, et dernier numéro qu'il a utilisé.
   * Le client s'en sert pour retrouver son curseur après un rechargement ou une perte de cache.
   */
  async getState(cashSessionId: string, userId: string) {
    const blocks = await this.blocksRepository.find({
      select: { startNumber: true, endNumber: true },
      where: { cashSessionId, userId },
      order: { startNumber: 'ASC' },
    });

    // Comparaison en entier : en texte, "100000" passerait avant "99999".
    const [row] = await this.blocksRepository.query<LastUsedRow[]>(
      `SELECT MAX(addition_number::integer) AS last
       FROM sales
       WHERE cash_session_id = $1 AND seller_id = $2`,
      [cashSessionId, userId],
    );

    return { blocks, lastUsedNumber: row?.last ?? null };
  }

  /**
   * Vérifie qu'un numéro émis hors ligne appartient à une plage réservée à ce vendeur.
   */
  async assertReservedFor(
    cashSessionId: string,
    userId: string,
    additionNumber: string,
  ) {
    const value = Number(additionNumber);

    // Le numéro doit tomber dans une plage de cet utilisateur pour cette session.
    const reserved = await this.blocksRepository
      .createQueryBuilder('block')
      .where('block.cash_session_id = :cashSessionId', { cashSessionId })
      .andWhere('block.user_id = :userId', { userId })
      .andWhere(':value BETWEEN block.start_number AND block.end_number', {
        value,
      })
      .getExists();

    if (!reserved) {
      throw new UnprocessableEntityException(
        `Le numéro d'addition ${additionNumber} ne vous est pas réservé.`,
      );
    }
  }

  // Prochain numéro libre : au-delà des ventes ET des plages réservées, pour qu'une vente
  // en ligne ne tombe jamais dans la plage d'une caisse hors ligne. Le verrou doit être pris.
  private async nextFreeNumber() {
    const [row] = await this.blocksRepository.query<NextNumberRow[]>(`
      SELECT GREATEST(
        COALESCE((SELECT MAX(addition_number::integer) FROM sales), 0),
        COALESCE((SELECT MAX(end_number) FROM addition_number_blocks), 0)
      ) + 1 AS next_number
    `);

    return Number(row?.next_number ?? 1);
  }
}
