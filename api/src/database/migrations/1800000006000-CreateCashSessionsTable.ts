import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCashSessionsTable1800000006000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cash_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        opened_by_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        closed_by_id uuid REFERENCES users(id) ON DELETE RESTRICT,
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
      CREATE INDEX cash_sessions_opened_by_id_index ON cash_sessions (opened_by_id)
    `);
    await queryRunner.query(`
      CREATE INDEX cash_sessions_status_index ON cash_sessions (status)
    `);
    await queryRunner.query(`
      CREATE INDEX cash_sessions_opened_at_index ON cash_sessions (opened_at)
    `);
    // Une seule session peut être ouverte à la fois pour toute la caisse, quel que soit l'utilisateur
    await queryRunner.query(`
      CREATE UNIQUE INDEX cash_sessions_one_open ON cash_sessions ((true)) WHERE status = 'OPEN'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE cash_sessions`);
  }
}
