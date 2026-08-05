import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cash_sessions'

  async up() {
    await this.db.rawQuery(`
      CREATE TABLE IF NOT EXISTS cash_sessions (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
        opened_at timestamptz NOT NULL,
        closed_at timestamptz NULL,
        opening_amount decimal(15, 2) NOT NULL DEFAULT 0,
        opening_currency text NOT NULL DEFAULT 'CDF' CHECK (opening_currency IN ('CDF', 'USD')),
        closing_amount decimal(15, 2) NULL,
        closing_currency text NULL CHECK (closing_currency IN ('CDF', 'USD')),
        created_at timestamptz NOT NULL,
        updated_at timestamptz NULL
      );
    `)

    await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS cash_sessions_user_id_index ON cash_sessions (user_id);`)
    await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS cash_sessions_status_index ON cash_sessions (status);`)
    await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS cash_sessions_opened_at_index ON cash_sessions (opened_at);`)
    await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS cash_sessions_user_id_status_index ON cash_sessions (user_id, status);`)

    await this.db.rawQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open_per_user
      ON cash_sessions (user_id)
      WHERE status = 'OPEN';
    `)
  }

  async down() {
    await this.db.rawQuery('DROP INDEX IF EXISTS cash_sessions_one_open_per_user')
    await this.db.rawQuery(`DROP TABLE IF EXISTS ${this.tableName}`)
  }
}
