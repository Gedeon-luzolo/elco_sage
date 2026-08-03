import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('category_id').references('id').inTable('product_categories').nullable()
      table.string('type').notNullable() // PRODUCT | SERVICE
      table.string('name').notNullable().unique()
      table.text('description').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      // Unité de vente/consommation (ex: feuille, unité)
      table.string('base_unit').notNullable()
      // Unité de conditionnement (ex: rame, carton) — uniquement pour les PRODUCT
      table.string('packaging_unit').nullable()
      // Quantité d'unités de base dans le conditionnement (ex: 500 feuilles par rame)
      table.integer('packaging_capacity').unsigned().nullable()

      table.decimal('price_usd', 15, 4).notNullable().defaultTo(0)
      table.decimal('price_cdf', 15, 4).notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
