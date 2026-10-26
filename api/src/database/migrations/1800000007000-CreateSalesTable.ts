import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSalesTable1800000007000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sales (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cash_session_id uuid NOT NULL REFERENCES cash_sessions(id) ON DELETE RESTRICT,
        customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
        operator_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        seller_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        payment_type text NOT NULL CHECK (payment_type IN ('CASH', 'CREDIT', 'OFFERED')),
        -- Renseignés pour une vente payée tout de suite ; vides pour un crédit ou un offert
        payment_method text CHECK (payment_method IN ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'BANK_CARD', 'CHEQUE')),
        payment_reference varchar(100),
        addition_number varchar(6) NOT NULL CONSTRAINT sales_addition_number_unique UNIQUE,
        sale_date timestamptz NOT NULL,
        currency text NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
        theoretical_amount numeric(15, 2) NOT NULL DEFAULT 0,
        discount_amount numeric(15, 2) NOT NULL DEFAULT 0,
        total_amount numeric(15, 2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX sales_cash_session_id_sale_date_index ON sales (cash_session_id, sale_date)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE sales`);
  }
}
