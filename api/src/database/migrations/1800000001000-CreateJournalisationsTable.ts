import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJournalisationsTable1800000001000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE journalisations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        module text NOT NULL CHECK (module IN ('AUTHENTIFICATION', 'USERS', 'EXCHANGE_RATES', 'PRODUCT_CATEGORIES', 'PRODUCT_SERVICES', 'INVENTORY', 'CUSTOMERS', 'SALES')),
        message text NOT NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    // Le journal se filtre par période
    await queryRunner.query(`
      CREATE INDEX journalisations_created_at_index ON journalisations (created_at)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE journalisations`);
  }
}
