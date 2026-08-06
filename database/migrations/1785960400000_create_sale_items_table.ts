import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sale_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('sale_id').notNullable().references('id').inTable('sales').onDelete('CASCADE')
      table.string('order_number', 100).notNullable()
      table
        .uuid('product_service_id')
        .notNullable()
        .references('id')
        .inTable('product_services')
        .onDelete('RESTRICT')

      table.decimal('quantity', 15, 2).notNullable()
      table.enu('currency', ['CDF', 'USD']).notNullable().defaultTo('CDF')
      table.decimal('unit_price', 15, 2).notNullable()
      table.decimal('total_price', 15, 2).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('sale_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
