import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('full_name', 150).notNullable()
      table.enu('customer_type', ['MALE', 'FEMALE', 'COMPANY']).notNullable()
      table.string('phone_number', 30).nullable()
      table.string('email', 254).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['id'])
      table.index(['full_name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
