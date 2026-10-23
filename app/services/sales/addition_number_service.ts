import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'

// Taille d'une plage reservee a une caisse pour vendre hors ligne.
const BLOCK_SIZE = 100
// La colonne addition_number est limitee a 6 caracteres.
const MAX_ADDITION_NUMBER = 999999
const ADDITION_NUMBER_LOCK = `SELECT pg_advisory_xact_lock(hashtext('sales_addition_number'))`

export interface AdditionNumberBlock {
  startNumber: number
  endNumber: number
}

@inject()
export default class AdditionNumberService {
  /**
   * Formate un numero d'addition (ex: 42 => "00042").
   */
  format(value: number) {
    return String(value).padStart(5, '0')
  }

  /**
   * Prochain numero libre : au-dela des ventes existantes ET des plages reservees,
   * pour qu'une vente en ligne ne tombe jamais dans la plage d'une caisse hors ligne.
   * Le verrou doit deja etre pris par l'appelant.
   */
  async nextFreeNumber(trx: TransactionClientContract) {
    const result = await trx.rawQuery(`
      SELECT GREATEST(
        COALESCE((SELECT MAX(addition_number::integer) FROM sales), 0),
        COALESCE((SELECT MAX(end_number) FROM addition_number_blocks), 0)
      ) + 1 AS next_number
    `)

    return Number(result.rows[0]?.next_number ?? 1)
  }

  /**
   * Genere le numero d'une vente creee en ligne (verrou tenu jusqu'a la fin de la transaction).
   */
  async generateOnlineNumber(trx: TransactionClientContract) {
    await trx.rawQuery(ADDITION_NUMBER_LOCK)

    return this.format(await this.nextFreeNumber(trx))
  }

  /**
   * Reserve une nouvelle plage de numeros pour une session de caisse.
   */
  async reserveBlock(cashSessionId: string, size = BLOCK_SIZE): Promise<AdditionNumberBlock> {
    return db.transaction(async (trx) => {
      await trx.rawQuery(ADDITION_NUMBER_LOCK)

      const startNumber = await this.nextFreeNumber(trx)
      const endNumber = startNumber + size - 1

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
   * Plages deja reservees pour une session (le client les recharge apres une reconnexion).
   */
  async listBlocks(cashSessionId: string): Promise<AdditionNumberBlock[]> {
    const rows = await db
      .from('addition_number_blocks')
      .where('cash_session_id', cashSessionId)
      .orderBy('start_number')

    return rows.map((row) => ({ startNumber: row.start_number, endNumber: row.end_number }))
  }

  /**
   * Verifie qu'un numero emis hors ligne appartient bien a une plage de la session.
   */
  async assertReservedFor(
    cashSessionId: string,
    additionNumber: string,
    trx: TransactionClientContract
  ) {
    const value = Number(additionNumber)

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
