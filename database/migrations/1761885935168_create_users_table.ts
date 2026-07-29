import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enu('role', ['ADMIN', 'DIRECTOR', 'CASHIER', 'OPERATOR']).notNullable().defaultTo('OPERATOR')
      table
        .enu('status', ['ACTIVE', 'INACTIVE', 'BLOCKED'])
        .notNullable()
        .defaultTo('ACTIVE')
      table.integer('failed_login_attempts').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
