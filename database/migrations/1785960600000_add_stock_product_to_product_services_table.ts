import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_services'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('stock_product_id')
        .nullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('SET NULL')

      table.index('stock_product_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['stock_product_id'])
      table.dropColumn('stock_product_id')
    })
  }
}
