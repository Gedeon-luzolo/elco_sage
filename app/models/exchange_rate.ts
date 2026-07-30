import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export type ExchangeRateType = 'buy' | 'sell'

export default class ExchangeRate extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare usdToCdfBuyRate: number

  @column()
  declare usdToCdfSellRate: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Genere la cle primaire avant l'insertion.
  @beforeCreate()
  static assignUuid(exchangeRate: ExchangeRate) {
    exchangeRate.id = randomUUID()
  }
}
