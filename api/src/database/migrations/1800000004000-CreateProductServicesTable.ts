import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductServicesTable1800000004000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE product_services (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id uuid REFERENCES product_categories(id),
        type varchar(255) NOT NULL CHECK (type IN ('PRODUCT', 'SERVICE')),
        name varchar(255) NOT NULL CONSTRAINT product_services_name_unique UNIQUE,
        is_active boolean NOT NULL DEFAULT true,
        -- Produit en stock consommé par un service (ex : le papier d'une impression)
        stock_product_id uuid REFERENCES product_services(id) ON DELETE SET NULL,
        base_unit varchar(255),
        packaging_unit varchar(255),
        packaging_capacity integer,
        price_usd numeric(15, 2) NOT NULL DEFAULT 0,
        price_cdf numeric(15, 2) NOT NULL DEFAULT 0,
        material_cost_usd numeric(15, 2) NOT NULL DEFAULT 0,
        material_cost_cdf numeric(15, 2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX product_services_stock_product_id_index ON product_services (stock_product_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE product_services`);
  }
}
