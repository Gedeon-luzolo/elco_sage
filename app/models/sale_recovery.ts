import CashSession from '#models/cash_session'
import Sale from '#models/sale'
import User from '#models/user'
import { Currency } from '#types/currency'
import { decimalColumn } from '#utils/decimal_column'
import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class SaleRecovery extends BaseModel {
  public static table = 'sale_recoveries'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare saleId: string

  @column()
  declare cashSessionId: string | null

  @column()
  declare receivedById: string

  @column(decimalColumn)
  declare amount: number

  @column()
  declare currency: Currency

  @column.dateTime()
  declare recoveredAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Sale, { foreignKey: 'saleId' })
  declare sale: BelongsTo<typeof Sale>

  @belongsTo(() => CashSession, { foreignKey: 'cashSessionId' })
  declare cashSession: BelongsTo<typeof CashSession>

  @belongsTo(() => User, { foreignKey: 'receivedById' })
  declare receivedBy: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(saleRecovery: SaleRecovery) {
    saleRecovery.id = saleRecovery.id || randomUUID()
  }
}
