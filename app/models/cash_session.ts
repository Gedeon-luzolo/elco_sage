import User from '#models/user'
import type { MoneyMap } from '#utils/money_map'
import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export default class CashSession extends BaseModel {
  public static table = 'cash_sessions'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare openedById: string

  @column()
  declare closedById: string | null

  @column()
  declare status: CashSessionStatus

  @column.dateTime()
  declare openedAt: DateTime

  @column.dateTime()
  declare closedAt: DateTime | null

  @column()
  declare systemAmounts: MoneyMap | null

  @column()
  declare closingAmounts: MoneyMap | null

  @column()
  declare differenceAmounts: MoneyMap | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'openedById' })
  declare openedBy: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'closedById' })
  declare closedBy: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(cashSession: CashSession) {
    cashSession.id = cashSession.id || randomUUID()
  }
}
