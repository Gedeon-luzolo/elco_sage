import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

// Taille d'une plage réservée à une caisse pour vendre hors ligne.
const BLOCK_SIZE = 100

// La colonne addition_number est limitée à 6 caractères.
const MAX_ADDITION_NUMBER = 999999

// Verrou qui sérialise toute attribution de numéro (vente en ligne ou réservation de plage).
const ADDITION_NUMBER_LOCK = `SELECT pg_advisory_xact_lock(hashtext('sales_addition_number'))`

// Plage de numéros d'addition réservée à une session de caisse.
export interface AdditionNumberBlock {
  startNumber: number
  endNumber: number
}

@inject()
export default class AdditionNumberService {
  /**
   * Formate un numéro d'addition (ex : 42 => "00042").
   */
  format(value: number) {
    return String(value).padStart(5, '0')
  }

  /**
   * Prochain numéro libre : au-delà des ventes existantes ET des plages réservées,
   * pour qu'une vente en ligne ne tombe jamais dans la plage d'une caisse hors ligne.
   * Le verrou doit déjà être pris par l'appelant.
   */
  async nextFreeNumber(trx: TransactionClientContract) {
    // Le plus grand numéro déjà vendu ou réservé, plus un
    const result = await trx.rawQuery(`
      SELECT GREATEST(
        COALESCE((SELECT MAX(addition_number::integer) FROM sales), 0),
        COALESCE((SELECT MAX(end_number) FROM addition_number_blocks), 0)
      ) + 1 AS next_number
    `)

    return Number(result.rows[0]?.next_number ?? 1)
  }

  /**
   * Génère le numéro d'une vente créée sans numéro fourni (verrou tenu jusqu'à la fin de la transaction).
   */
  async generateOnlineNumber(trx: TransactionClientContract) {
    // Deux ventes simultanées ne peuvent pas recevoir le même numéro
    await trx.rawQuery(ADDITION_NUMBER_LOCK)

    return this.format(await this.nextFreeNumber(trx))
  }

  /**
   * Réserve une nouvelle plage de numéros pour une session de caisse.
   */
  async reserveBlock(cashSessionId: string, size = BLOCK_SIZE): Promise<AdditionNumberBlock> {
    return db.transaction(async (trx) => {
      await trx.rawQuery(ADDITION_NUMBER_LOCK)

      // La plage commence juste après tout ce qui existe déjà
      const startNumber = await this.nextFreeNumber(trx)
      const endNumber = startNumber + size - 1

      // La numérotation tient sur 6 chiffres : au-delà, plus aucune réservation possible
      if (endNumber > MAX_ADDITION_NUMBER) {
        throw new Error("La numérotation des additions est épuisée, contactez l'administrateur.")
      }

      await trx.table('addition_number_blocks').insert({
        id: randomUUID(),
        cash_session_id: cashSessionId,
        start_number: startNumber,
        end_number: endNumber,
        created_at: DateTime.now().toSQL({ includeOffset: false }),
      })

      return { startNumber, endNumber }
    })
  }

  /**
   * Plages déjà réservées pour une session (le client les recharge après une reconnexion).
   */
  async listBlocks(cashSessionId: string): Promise<AdditionNumberBlock[]> {
    const rows = await db
      .from('addition_number_blocks')
      .where('cash_session_id', cashSessionId)
      .orderBy('start_number')

    // Conversion des colonnes SQL vers les noms utilisés par l'API
    return rows.map((row) => ({ startNumber: row.start_number, endNumber: row.end_number }))
  }

  /**
   * Plus grand numéro déjà utilisé par une vente de la session (null si aucune vente).
   * Le client s'en sert pour retrouver son curseur après un rechargement ou une perte de cache.
   */
  async lastUsedNumber(cashSessionId: string): Promise<number | null> {
    const row = await db
      .from('sales')
      .where('cash_session_id', cashSessionId)
      .max('addition_number as last')
      .first()

    return row?.last === null || row?.last === undefined ? null : Number(row.last)
  }

  /**
   * Vérifie qu'un numéro émis hors ligne appartient bien à une plage de la session.
   */
  async assertReservedFor(
    cashSessionId: string,
    additionNumber: string,
    trx: TransactionClientContract
  ) {
    const value = Number(additionNumber)

    // Le numéro doit tomber dans une plage réservée à cette session
    const block = await trx
      .from('addition_number_blocks')
      .where('cash_session_id', cashSessionId)
      .where('start_number', '<=', value)
      .where('end_number', '>=', value)
      .first()

    if (!block) {
      throw new Error(`Le numéro d'addition ${additionNumber} n'est pas réservé pour cette caisse.`)
    }
  }
}
