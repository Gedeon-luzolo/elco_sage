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
      // Utilisateur à qui la plage est réservée : la session est partagée, donc deux appareils
      // ne doivent jamais émettre les mêmes numéros.
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      // Plage réservée à l'utilisateur : le client hors ligne n'émet que des numéros de cette plage.
      table.integer('start_number').notNullable()
      table.integer('end_number').notNullable()
      table.timestamp('created_at').notNullable()

      table.index(['cash_session_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
