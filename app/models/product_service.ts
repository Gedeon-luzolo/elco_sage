import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProductCategory from '#models/product_category'

export enum ProductServiceType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export default class ProductService extends BaseModel {
  public static table = 'product_services'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare categoryId: string | null

  @column()
  declare stockProductId: string | null

  @column()
  declare type: ProductServiceType

  @column()
  declare name: string

  @column()
  declare isActive: boolean

  /** Unité de vente/consommation (ex: feuille, unité, heure) */
  @column()
  declare baseUnit: string

  /** Unité de conditionnement (ex: rame, carton) — uniquement pour les PRODUCT */
  @column()
  declare packagingUnit: string | null

  /** Quantité d'unités de base dans le conditionnement (ex: 500 feuilles par rame) */
  @column()
  declare packagingCapacity: number | null

  @column()
  declare priceUsd: number

  @column()
  declare priceCdf: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ProductCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof ProductCategory>

  @belongsTo(() => ProductService, { foreignKey: 'stockProductId' })
  declare stockProduct: BelongsTo<typeof ProductService>

  @beforeCreate()
  static assignUuid(productService: ProductService) {
    productService.id = productService.id || randomUUID()
  }
}
