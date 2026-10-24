import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Le bon est unique pour toute l'addition : il quitte les lignes pour l'entête de vente
    this.schema.alterTable('sales', (table) => {
      table.string('order_number', 100).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `update sales set order_number = coalesce(
          (select min(order_number) from sale_items where sale_items.sale_id = sales.id),
          addition_number
        )`
      )
    })

    this.schema.alterTable('sales', (table) => {
      table.string('order_number', 100).notNullable().alter()
    })

    this.schema.alterTable('sale_items', (table) => {
      table.dropColumn('order_number')
    })

    // Un bon ne peut servir qu'à une addition active : une addition annulée libère son bon
    this.schema.raw(
      `create unique index sales_active_order_number_unique on sales (order_number) where status = 'ACTIVE'`
    )
  }

  async down() {
    this.schema.raw('drop index if exists sales_active_order_number_unique')

    this.schema.alterTable('sale_items', (table) => {
      table.string('order_number', 100).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(
        `update sale_items set order_number = (select order_number from sales where sales.id = sale_items.sale_id)`
      )
    })

    this.schema.alterTable('sale_items', (table) => {
      table.string('order_number', 100).notNullable().alter()
    })

    this.schema.alterTable('sales', (table) => {
      table.dropColumn('order_number')
    })
  }
}
