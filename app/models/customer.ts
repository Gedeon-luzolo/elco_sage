import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export enum CustomerType {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  COMPANY = 'COMPANY',
}

export default class Customer extends BaseModel {
  public static table = 'customers'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string

  @column()
  declare customerType: CustomerType

  @column()
  declare phoneNumber: string | null

  @column()
  declare email: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(customer: Customer) {
    customer.id = customer.id || randomUUID()
  }
}
