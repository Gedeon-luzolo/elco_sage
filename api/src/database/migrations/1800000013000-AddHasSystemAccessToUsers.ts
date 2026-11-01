import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasSystemAccessToUsers1800000013000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Un compte n'a pas accès au système tant que la gestion du personnel ne l'a pas ouvert
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN has_system_access boolean NOT NULL DEFAULT false
    `);
    // Les comptes existants gardent l'accès qu'ils avaient, sauf les opérateurs
    await queryRunner.query(`
      UPDATE users SET has_system_access = true WHERE role <> 'OPERATOR'
    `);
    // Sans accès, un compte n'a pas de mot de passe
    await queryRunner.query(
      `ALTER TABLE users ALTER COLUMN password DROP NOT NULL`,
    );
    await queryRunner.query(`
      UPDATE users SET password = NULL WHERE NOT has_system_access
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Les mots de passe effacés ne se retrouvent pas : une valeur qui n'est pas un hash bcrypt bloque la connexion
    await queryRunner.query(
      `UPDATE users SET password = '!' WHERE password IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE users ALTER COLUMN password SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE users DROP COLUMN has_system_access`);
  }
}
