import ProductService from '#models/product_service'
import Sale from '#models/sale'
import { Currency } from '#types/currency'
import { decimalColumn } from '#utils/decimal_column'
import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class SaleItem extends BaseModel {
  public static table = 'sale_items'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare saleId: string

  @column()
  declare orderNumber: string

  @column()
  declare productServiceId: string

  @column(decimalColumn)
  declare quantity: number

  @column()
  declare currency: Currency

  @column(decimalColumn)
  declare unitPrice: number

  @column(decimalColumn)
  declare totalPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Sale, { foreignKey: 'saleId' })
  declare sale: BelongsTo<typeof Sale>

  @belongsTo(() => ProductService, { foreignKey: 'productServiceId' })
  declare productService: BelongsTo<typeof ProductService>

  @beforeCreate()
  static assignUuid(saleItem: SaleItem) {
    saleItem.id = saleItem.id || randomUUID()
  }
}
