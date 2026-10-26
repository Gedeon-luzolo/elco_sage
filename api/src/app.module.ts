import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AppController } from './app.controller.js';
import { RedisModule } from './common/redis/redis.module.js';
import { createAppTypeOrmOptions } from './config/database.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createAppTypeOrmOptions,
      inject: [ConfigService],
    }),
    RedisModule,
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
