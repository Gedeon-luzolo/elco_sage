import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Supprime l'ancienne contrainte avant d'en créer une nouvelle plus large.
    this.schema.raw(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check
    `)

    // Ajoute la contrainte mise à jour avec PRODUCT_SERVICES.
    this.schema.raw(`
      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (module IN ('AUTHENTIFICATION', 'USERS', 'EXCHANGE_RATES', 'PRODUCT_CATEGORIES', 'PRODUCT_SERVICES'))
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
      CHECK (module IN ('AUTHENTIFICATION', 'USERS', 'EXCHANGE_RATES', 'PRODUCT_CATEGORIES'))
    `)
  }
}
