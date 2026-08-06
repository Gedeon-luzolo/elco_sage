import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('cash_session_id')
        .notNullable()
        .references('id')
        .inTable('cash_sessions')
        .onDelete('RESTRICT')
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('customers')
        .onDelete('SET NULL')
      table.uuid('operator_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.uuid('seller_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')

      table.enu('payment_type', ['CASH', 'CREDIT', 'OFFERED']).notNullable()
      table.string('addition_number', 6).notNullable().unique()
      table.timestamp('sale_date').notNullable()

      table.enu('currency', ['CDF', 'USD']).notNullable().defaultTo('CDF')
      table.decimal('theoretical_amount', 15, 2).notNullable().defaultTo(0)
      table.decimal('discount_amount', 15, 2).notNullable().defaultTo(0)
      table.decimal('total_amount', 15, 2).notNullable().defaultTo(0)

      table.enu('status', ['ACTIVE', 'CANCELLED']).notNullable().defaultTo('ACTIVE')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['cash_session_id', 'sale_date'])
      table.index('addition_number')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
