import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createAppTypeOrmOptions } from '../../config/database.config.js';
import { AdminSeeder } from './admin.seeder.js';
import { CatalogSeeder } from './catalog.seeder.js';
import { SeederModule } from './seeder.module.js';

const logger = new Logger('Seeders');

// Contexte minimal : la base et les seeders, sans serveur HTTP ni Redis.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createAppTypeOrmOptions,
      inject: [ConfigService],
    }),
    SeederModule,
  ],
})
class SeedContextModule {}

async function runSeeders(command: string): Promise<void> {
  const app = await NestFactory.createApplicationContext(SeedContextModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    if (command === 'admin' || command === 'all') {
      logger.log('Seeding du compte administrateur...');
      await app.get(AdminSeeder).seed();
    }

    if (command === 'catalog' || command === 'all') {
      logger.log('Seeding du catalogue...');
      await app.get(CatalogSeeder).seed();
    }

    logger.log('Seeding terminé avec succès.');
  } finally {
    await app.close();
  }
}

// Commande CLI optionnelle : "admin", "catalog", ou "all" (par défaut).
try {
  await runSeeders(process.argv[2] ?? 'all');
  process.exit(0);
} catch (error) {
  logger.error('Erreur lors du seeding :', error);
  process.exit(1);
}
