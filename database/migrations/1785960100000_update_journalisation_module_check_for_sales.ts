import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check;

      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (
        module IN (
          'AUTHENTIFICATION',
          'USERS',
          'EXCHANGE_RATES',
          'PRODUCT_CATEGORIES',
          'PRODUCT_SERVICES',
          'INVENTORY',
          'CUSTOMERS',
          'SALES'
        )
      );
    `)
  }

  async down() {
    await this.db.rawQuery(`
      ALTER TABLE journalisations
      DROP CONSTRAINT IF EXISTS journalisations_module_check;

      ALTER TABLE journalisations
      ADD CONSTRAINT journalisations_module_check
      CHECK (
        module IN (
          'AUTHENTIFICATION',
          'USERS',
          'EXCHANGE_RATES',
          'PRODUCT_CATEGORIES',
          'PRODUCT_SERVICES',
          'INVENTORY',
          'CUSTOMERS'
        )
      );
    `)
  }
}
