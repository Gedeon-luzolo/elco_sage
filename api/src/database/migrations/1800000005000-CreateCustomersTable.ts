import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersTable1800000005000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name varchar(150) NOT NULL,
        customer_type text NOT NULL CHECK (customer_type IN ('MALE', 'FEMALE', 'COMPANY')),
        phone_number varchar(30),
        email varchar(254),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX customers_full_name_index ON customers (full_name)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE customers`);
  }
}
