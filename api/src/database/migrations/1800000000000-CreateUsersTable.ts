import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1800000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name varchar(255),
        email varchar(254) NOT NULL CONSTRAINT users_email_unique UNIQUE,
        password varchar(255) NOT NULL,
        role text NOT NULL DEFAULT 'OPERATOR' CHECK (role IN ('ADMIN', 'DIRECTOR', 'CASHIER', 'OPERATOR')),
        status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
        failed_login_attempts integer NOT NULL DEFAULT 0,
        -- Lettre du vendeur (A, B… puis AA, AB…), en tête des références qu'il crée hors ligne
        seller_code varchar(2) CONSTRAINT users_seller_code_unique UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE users`);
  }
}
