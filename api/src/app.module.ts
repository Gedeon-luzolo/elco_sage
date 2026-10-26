import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AppController } from './app.controller.js';
import { CacheModule } from './common/cache/cache.module.js';
import { RedisModule } from './common/redis/redis.module.js';
import { createAppTypeOrmOptions } from './config/database.config.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module.js';
import { JournalisationsModule } from './modules/journalisations/journalisations.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createAppTypeOrmOptions,
      inject: [ConfigService],
    }),
    RedisModule,
    CacheModule,
    JournalisationsModule,
    AuthModule,
    UsersModule,
    ExchangeRatesModule,
    CatalogModule,
  ],
  controllers: [AppController],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Enregistre la DataSource pour typeorm-transactional.
   */
  onModuleInit() {
    addTransactionalDataSource(this.dataSource);
  }
}
