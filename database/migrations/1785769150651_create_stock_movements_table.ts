import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_movements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('product_services')
        .onDelete('CASCADE')
      table.date('date').notNullable()

      // Stock initial (hérité du stock physique du jour précédent)
      table.decimal('initial_stock', 15, 2).notNullable().defaultTo(0)

      // Entrées (achats, réceptions) - saisie manuelle
      table.decimal('entries', 15, 2).notNullable().defaultTo(0)

      // Sorties (ventes) - automatique via système de ventes (à implémenter)
      table.decimal('outputs', 15, 2).notNullable().defaultTo(0)

      // Pertes (casse, vol, avarie) - saisie manuelle
      table.decimal('losses', 15, 2).nullable().defaultTo(0)

      // Stock physique (inventaire réel) - saisie manuelle en fin de journée
      table.decimal('physical_stock', 15, 2).nullable()

      // Contrainte unique: 1 seul mouvement par produit par jour
      table.unique(['product_id', 'date'])

      // Index pour les recherches fréquentes
      table.index('product_id') // Recherche par produit
      table.index('date') // Recherche par date
      table.index(['product_id', 'date']) // Index composite pour les requêtes combinées
      table.index(['product_id', 'physical_stock']) // Pour trouver le dernier stock physique validé

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
