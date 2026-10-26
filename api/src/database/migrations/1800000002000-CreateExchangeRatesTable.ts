import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExchangeRatesTable1800000002000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE exchange_rates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        exchange_rate numeric(15, 2) NOT NULL,
        sell_rate numeric(15, 2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE exchange_rates`);
  }
}
