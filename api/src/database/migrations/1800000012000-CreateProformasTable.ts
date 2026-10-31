import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProformasTable1800000012000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE proformas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        -- Le numéro repart à 1 chaque mois (mois d'émission à Kinshasa)
        number integer NOT NULL,
        customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        created_by_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        -- Vente issue de la conversion de la proforma
        sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
        -- Date du document, imprimée sur la proforma ; created_at reste la date technique
        issued_at timestamptz NOT NULL,
        currency text NOT NULL DEFAULT 'CDF' CHECK (currency IN ('CDF', 'USD')),
        theoretical_amount numeric(15, 2) NOT NULL DEFAULT 0,
        discount_amount numeric(15, 2) NOT NULL DEFAULT 0,
        total_amount numeric(15, 2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'CONVERTED', 'CANCELLED')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX proformas_issued_at_index ON proformas (issued_at)
    `);
    // Pas deux fois le même numéro dans un mois, le mois étant lu à l'heure de Kinshasa
    await queryRunner.query(`
      CREATE UNIQUE INDEX proformas_month_number_unique
      ON proformas (date_trunc('month', issued_at AT TIME ZONE 'Africa/Kinshasa'), number)
    `);
    await queryRunner.query(`
      CREATE TABLE proforma_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        proforma_id uuid NOT NULL REFERENCES proformas(id) ON DELETE CASCADE,
        product_service_id uuid NOT NULL REFERENCES product_services(id) ON DELETE RESTRICT,
        position integer NOT NULL,
        designation varchar(255) NOT NULL,
        quantity numeric(15, 2) NOT NULL,
        unit_price numeric(15, 2) NOT NULL,
        total_price numeric(15, 2) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX proforma_items_proforma_id_index ON proforma_items (proforma_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE proforma_items`);
    await queryRunner.query(`DROP TABLE proformas`);
  }
}
