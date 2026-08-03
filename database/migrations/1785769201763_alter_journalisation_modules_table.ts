import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Supprimer l'ancienne contrainte
    this.schema.raw(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check
    `)

    // Ajouter la contrainte mise à jour avec INVENTORY
    this.schema.raw(`
      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (module IN ('AUTHENTIFICATION', 'USERS', 'EXCHANGE_RATES', 'PRODUCT_CATEGORIES', 'PRODUCT_SERVICES', 'INVENTORY'))
    `)
  }

  async down() {
    // Revenir à la contrainte sans INVENTORY
    this.schema.raw(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check
    `)

    this.schema.raw(`
      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (module IN ('AUTHENTIFICATION', 'USERS', 'EXCHANGE_RATES', 'PRODUCT_CATEGORIES', 'PRODUCT_SERVICES'))
    `)
  }
}
