import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cash_sessions'

  async up() {
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id uuid PRIMARY KEY,
        opened_by_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        closed_by_id uuid NULL REFERENCES users(id) ON DELETE RESTRICT,
        status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
        opened_at timestamptz NOT NULL,
        closed_at timestamptz NULL,
        system_amounts jsonb NULL,
        closing_amounts jsonb NULL,
        difference_amounts jsonb NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NULL
      );
    `)

    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS cash_sessions_opened_by_id_index ON cash_sessions (opened_by_id);`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS cash_sessions_status_index ON cash_sessions (status);`
    )
    await this.db.rawQuery(
      `CREATE INDEX IF NOT EXISTS cash_sessions_opened_at_index ON cash_sessions (opened_at);`
    )

    // Une seule session peut être ouverte à la fois pour toute la caisse, quel que soit l'utilisateur.
    await this.db.rawQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open
      ON cash_sessions ((true))
      WHERE status = 'OPEN';
    `)
  }

  async down() {
    await this.db.rawQuery('DROP INDEX IF EXISTS cash_sessions_one_open')
    await this.db.rawQuery(`DROP TABLE IF EXISTS ${this.tableName}`)
  }
}
