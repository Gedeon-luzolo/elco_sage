import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check
    `)

    this.schema.raw(`
      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (module IN ('AUTHENTIFICATION', 'USERS', 'EXCHANGE_RATES'))
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check
    `)

    this.schema.raw(`
      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (module IN ('AUTHENTIFICATION', 'USERS'))
    `)
  }
}
