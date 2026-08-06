import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sale_recoveries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('sale_id').notNullable().references('id').inTable('sales').onDelete('CASCADE')
      table
        .uuid('cash_session_id')
        .nullable()
        .references('id')
        .inTable('cash_sessions')
        .onDelete('SET NULL')
      table.uuid('received_by_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')

      table.decimal('amount', 15, 2).notNullable()
      table.enu('currency', ['CDF', 'USD']).notNullable().defaultTo('CDF')
      table.timestamp('recovered_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('sale_id')
      table.index(['cash_session_id', 'recovered_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
