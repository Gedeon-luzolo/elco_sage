import User from '#models/user'
import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export enum JournalisationModule {
  AUTHENTIFICATION = 'AUTHENTIFICATION',
  EXCHANGE_RATES = 'EXCHANGE_RATES',
  USERS = 'USERS',
  PRODUCT_CATEGORIES = 'PRODUCT_CATEGORIES',
  PRODUCT_SERVICES = 'PRODUCT_SERVICES',
  INVENTORY = 'INVENTORY',
  CUSTOMERS = 'CUSTOMERS',
  SALES = 'SALES',
}

export default class Journalisation extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare module: JournalisationModule

  @column()
  declare message: string

  @column()
  declare userId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(journalisation: Journalisation) {
    journalisation.id = randomUUID()
  }
}
