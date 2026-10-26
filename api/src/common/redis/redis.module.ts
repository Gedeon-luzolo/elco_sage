import { Global, Module, OnApplicationShutdown, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { createRedisOptions } from '../../config/redis.config.js';

// Jeton d'injection du client Redis partagé.
export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (configService: ConfigService) =>
        new Redis(createRedisOptions(configService)),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /**
   * Ferme proprement la connexion à l'arrêt de l'application.
   */
  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
