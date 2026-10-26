import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

// Construit la connexion Redis utilisée par le cache et les tokens d'accès.
export function createRedisOptions(configService: ConfigService): RedisOptions {
  return {
    host: configService.get<string>('REDIS_HOST'),
    port: Number(configService.get<string>('REDIS_PORT')),
    password: configService.get<string>('REDIS_PASSWORD') || undefined,
    db: Number(configService.get<string>('REDIS_DB') ?? 0),
    // Réessaie sans abandonner, avec un délai croissant plafonné à 2 secondes.
    retryStrategy: (times) => Math.min(times * 50, 2_000),
  };
}
