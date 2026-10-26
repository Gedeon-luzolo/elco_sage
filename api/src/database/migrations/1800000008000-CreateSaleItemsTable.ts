import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleItemsTable1800000008000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sale_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_service_id uuid NOT NULL REFERENCES product_services(id) ON DELETE RESTRICT,
        quantity numeric(15, 2) NOT NULL,
        currency text NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
        unit_price numeric(15, 2) NOT NULL,
        total_price numeric(15, 2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX sale_items_sale_id_index ON sale_items (sale_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE sale_items`);
  }
}
