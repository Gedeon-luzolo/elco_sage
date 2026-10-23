import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addition_number_blocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('cash_session_id')
        .notNullable()
        .references('id')
        .inTable('cash_sessions')
        .onDelete('RESTRICT')
      // Plage reservee a la caisse : le client hors ligne n'emet que des numeros de cette plage.
      table.integer('start_number').notNullable()
      table.integer('end_number').notNullable()
      table.timestamp('created_at').notNullable()

      table.index('cash_session_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
