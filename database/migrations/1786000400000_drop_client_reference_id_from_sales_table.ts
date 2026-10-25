import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    // Colonne orpheline : sa migration a disparu et aucun code ne l'utilise.
    // « if exists » car seules les bases qui ont joué l'ancienne migration l'ont.
    this.schema.raw(`alter table ${this.tableName} drop column if exists client_reference_id`)
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('client_reference_id', 100).nullable().unique()
    })
  }
}
