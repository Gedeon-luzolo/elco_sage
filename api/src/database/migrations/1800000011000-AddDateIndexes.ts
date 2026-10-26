import type { MigrationInterface, QueryRunner } from 'typeorm';

// Index des filtres par période du pilotage, de l'historique et du journal.
export class AddDateIndexes1800000011000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX sales_sale_date_index ON sales (sale_date)
    `);
    await queryRunner.query(`
      CREATE INDEX sale_recoveries_recovered_at_index ON sale_recoveries (recovered_at)
    `);
    await queryRunner.query(`
      CREATE INDEX journalisations_created_at_index ON journalisations (created_at)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX journalisations_created_at_index`);
    await queryRunner.query(`DROP INDEX sale_recoveries_recovered_at_index`);
    await queryRunner.query(`DROP INDEX sales_sale_date_index`);
  }
}
