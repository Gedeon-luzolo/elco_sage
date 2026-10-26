import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleRecoveriesTable1800000009000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sale_recoveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        cash_session_id uuid REFERENCES cash_sessions(id) ON DELETE SET NULL,
        received_by_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        amount numeric(15, 2) NOT NULL,
        currency text NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
        payment_method text NOT NULL CHECK (payment_method IN ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'BANK_CARD', 'CHEQUE')),
        payment_reference varchar(100),
        recovered_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX sale_recoveries_sale_id_index ON sale_recoveries (sale_id)
    `);
    await queryRunner.query(`
      CREATE INDEX sale_recoveries_cash_session_id_recovered_at_index ON sale_recoveries (cash_session_id, recovered_at)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE sale_recoveries`);
  }
}
