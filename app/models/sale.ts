import CashSession from '#models/cash_session'
import Customer from '#models/customer'
import User from '#models/user'
import { Currency } from '#types/currency'
import { decimalColumn } from '#utils/decimal_column'
import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import SaleItem from '#models/sale_item'
import SaleRecovery from '#models/sale_recovery'

export enum SalePaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  OFFERED = 'OFFERED',
}

export enum SaleStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export default class Sale extends BaseModel {
  public static table = 'sales'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare cashSessionId: string

  @column()
  declare customerId: string | null

  @column()
  declare operatorId: string

  @column()
  declare sellerId: string

  @column()
  declare paymentType: SalePaymentType

  @column()
  declare additionNumber: string

  @column.dateTime()
  declare saleDate: DateTime

  @column()
  declare currency: Currency

  @column(decimalColumn)
  declare theoreticalAmount: number

  @column(decimalColumn)
  declare discountAmount: number

  @column(decimalColumn)
  declare totalAmount: number

  @column()
  declare status: SaleStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => CashSession, { foreignKey: 'cashSessionId' })
  declare cashSession: BelongsTo<typeof CashSession>

  @belongsTo(() => Customer, { foreignKey: 'customerId' })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => User, { foreignKey: 'operatorId' })
  declare operator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'sellerId' })
  declare seller: BelongsTo<typeof User>

  @hasMany(() => SaleItem, { foreignKey: 'saleId' })
  declare items: HasMany<typeof SaleItem>

  @hasMany(() => SaleRecovery, { foreignKey: 'saleId' })
  declare recoveries: HasMany<typeof SaleRecovery>

  @beforeCreate()
  static assignUuid(sale: Sale) {
    sale.id = sale.id || randomUUID()
  }
}
