import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

config();

const currentDir = dirname(fileURLToPath(import.meta.url));

// DataSource utilisée par la CLI TypeORM pour jouer les migrations.
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(currentDir, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(currentDir, 'migrations', '*{.ts,.js}')],
  synchronize: false,
  migrationsTransactionMode: 'each',
});
