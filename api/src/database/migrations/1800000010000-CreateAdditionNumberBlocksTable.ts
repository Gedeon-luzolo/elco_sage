import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdditionNumberBlocksTable1800000010000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Plage de numéros d'addition réservée à un utilisateur : le client hors ligne n'émet que ceux-là.
    // La session est partagée, donc deux appareils ne doivent jamais émettre les mêmes numéros.
    await queryRunner.query(`
      CREATE TABLE addition_number_blocks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cash_session_id uuid NOT NULL REFERENCES cash_sessions(id) ON DELETE RESTRICT,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        start_number integer NOT NULL,
        end_number integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX addition_number_blocks_cash_session_id_user_id_index ON addition_number_blocks (cash_session_id, user_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE addition_number_blocks`);
  }
}
