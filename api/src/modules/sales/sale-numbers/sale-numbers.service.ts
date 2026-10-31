import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { User } from '../../users/entities/user.entity.js';
import { Sale } from '../sales/entities/sale.entity.js';

// Verrou qui sérialise l'attribution des numéros de facture, libéré à la fin de la transaction.
const INVOICE_NUMBER_LOCK = `SELECT pg_advisory_xact_lock(hashtext('sales_invoice_number'))`;

// Verrou qui empêche deux vendeurs de recevoir la même lettre en même temps.
const SELLER_CODE_LOCK = `SELECT pg_advisory_xact_lock(hashtext('users_seller_code'))`;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type NextNumberRow = { next_number: number };
type LastCounterRow = { last: number | null };

/**
 * Formate un numéro de facture (ex : 1 => "00001").
 */
export function formatInvoiceNumber(value: number) {
  return String(value).padStart(5, '0');
}

/**
 * Lettre du vendeur à partir de son rang : A… Z, puis AA, AB… ZZ.
 */
function sellerCodeAt(index: number) {
  if (index < ALPHABET.length) {
    return ALPHABET[index];
  }

  const rest = index - ALPHABET.length;
  return `${ALPHABET[Math.floor(rest / ALPHABET.length)]}${ALPHABET[rest % ALPHABET.length]}`;
}

// Nombre de lettres possibles : 26 sur une lettre, 676 sur deux.
const SELLER_CODE_COUNT = ALPHABET.length + ALPHABET.length ** 2;

@Injectable()
export class SaleNumbersService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Prend le verrou de numérotation. N'a d'effet qu'à l'intérieur d'une transaction.
   */
  async lock() {
    // Deux ventes simultanées ne peuvent pas lire le même « prochain numéro ».
    await this.salesRepository.query(INVOICE_NUMBER_LOCK);
  }

  /**
   * Numéro de facture qui suit le dernier attribué. Le verrou doit être pris.
   */
  async nextInvoiceNumber() {
    // Calculé dans la transaction de la vente : un échec ne consomme aucun numéro.
    const [row] = await this.salesRepository.query<NextNumberRow[]>(
      `SELECT COALESCE(MAX(invoice_number), 0) + 1 AS next_number FROM sales`,
    );

    return Number(row?.next_number ?? 1);
  }

  /**
   * Lettre du vendeur et dernier compteur qu'il a utilisé hors ligne.
   * Le client s'en sert pour créer ses références et retrouver son curseur après une perte du cache.
   */
  async getOfflineState(userId: string) {
    const sellerCode = await this.ensureSellerCode(userId);

    // Le compteur est la partie chiffrée de la référence (A0009 => 9).
    const [row] = await this.salesRepository.query<LastCounterRow[]>(
      `SELECT MAX(CAST(substring(offline_reference FROM '[0-9]+$') AS integer)) AS last
       FROM sales
       WHERE seller_id = $1 AND offline_reference IS NOT NULL`,
      [userId],
    );

    return { sellerCode, lastCounter: row?.last ?? 0 };
  }

  /**
   * Vérifie qu'une référence hors ligne commence bien par la lettre de ce vendeur.
   */
  async assertOfflineReference(userId: string, offlineReference: string) {
    const user = await this.usersRepository.findOne({
      select: { id: true, sellerCode: true },
      where: { id: userId },
    });

    // Les lettres de tête doivent être exactement celles du vendeur : A0009 n'est pas à AB.
    const prefix = offlineReference.replace(/[0-9]+$/, '');

    if (!user?.sellerCode || prefix !== user.sellerCode) {
      throw new UnprocessableEntityException(
        `La commande ${offlineReference} ne vous appartient pas.`,
      );
    }
  }

  // Lettre du vendeur ; la première libre lui est attribuée s'il n'en a pas encore.
  @Transactional()
  private async ensureSellerCode(userId: string) {
    await this.usersRepository.query(SELLER_CODE_LOCK);

    const user = await this.usersRepository.findOneOrFail({
      select: { id: true, sellerCode: true },
      where: { id: userId },
    });

    if (user.sellerCode) {
      return user.sellerCode;
    }

    // Lettres déjà prises, pour donner la première qui reste.
    const taken = new Set(
      (
        await this.usersRepository
          .createQueryBuilder('user')
          .select('user.seller_code', 'code')
          .where('user.seller_code IS NOT NULL')
          .getRawMany<{ code: string }>()
      ).map((row) => row.code),
    );

    for (let index = 0; index < SELLER_CODE_COUNT; index++) {
      const code = sellerCodeAt(index);

      if (!taken.has(code)) {
        await this.usersRepository.update(userId, { sellerCode: code });
        return code;
      }
    }

    throw new UnprocessableEntityException(
      "Plus aucune lettre de vendeur disponible, contactez l'administrateur.",
    );
  }
}
