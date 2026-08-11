import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class ProductCategory extends BaseModel {
  public static table = 'product_categories'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(category: ProductCategory) {
    category.id = category.id || randomUUID()
  }
}
