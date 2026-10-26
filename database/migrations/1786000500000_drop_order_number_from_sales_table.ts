import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    // Le bon de commande disparaît : l'addition seule identifie la vente.
    this.schema.raw('drop index if exists sales_active_order_number_unique')

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('order_number')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('order_number', 100).nullable()
    })

    // Les bons perdus ne reviennent pas : on reprend le numéro d'addition, unique lui aussi.
    this.defer(async (db) => {
      await db.rawQuery(`update ${this.tableName} set order_number = addition_number`)
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('order_number', 100).notNullable().alter()
    })

    this.schema.raw(
      `create unique index sales_active_order_number_unique on ${this.tableName} (order_number) where status = 'ACTIVE'`
    )
  }
}
