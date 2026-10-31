import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCashSessionsTable1800000006000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cash_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        -- Chaque vendeur a sa propre caisse : il l'ouvre, y vend et la clôture
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
        opened_at timestamptz NOT NULL,
        closed_at timestamptz,
        system_amounts jsonb,
        closing_amounts jsonb,
        difference_amounts jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX cash_sessions_user_id_index ON cash_sessions (user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX cash_sessions_opened_at_index ON cash_sessions (opened_at)
    `);
    // Une seule session ouverte à la fois par utilisateur
    await queryRunner.query(`
      CREATE UNIQUE INDEX cash_sessions_one_open_per_user ON cash_sessions (user_id) WHERE status = 'OPEN'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE cash_sessions`);
  }
}
