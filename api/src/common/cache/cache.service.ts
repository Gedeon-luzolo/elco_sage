import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../redis/redis.module.js';

/**
 * Cache Redis avec invalidation par préfixe.
 * Une panne de Redis ne casse jamais une requête : la lecture retombe sur la base.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /**
   * Lit une valeur ; null si elle est absente, illisible ou si Redis est injoignable.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);

      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error) {
      this.logger.warn(
        `Lecture du cache impossible (${key}) : ${String(error)}`,
      );
      return null;
    }
  }

  /**
   * Enregistre une valeur pour une durée donnée (EX = secondes).
   */
  async set<T>(key: string, value: T, ttlSeconds: number) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Écriture du cache impossible (${key}) : ${String(error)}`,
      );
    }
  }

  /**
   * Supprime toutes les clés qui commencent par l'un des préfixes.
   */
  async invalidateByPattern(patterns: string[]) {
    try {
      await Promise.all(
        patterns.map((pattern) => this.scanAndDelete(`${pattern}*`)),
      );
    } catch (error) {
      this.logger.warn(
        `Invalidation du cache impossible (${patterns.join(', ')}) : ${String(error)}`,
      );
    }
  }

  /**
   * Remplace {0}, {1}… dans un modèle de clé par les arguments donnés.
   */
  resolveKey(template: string, args: unknown[]) {
    return template.replace(/\{(\d+)\}/g, (_, index: string) =>
      String(args[Number(index)] ?? 'null'),
    );
  }

  // SCAN parcourt les clés par lots sans bloquer Redis, contrairement à KEYS.
  private async scanAndDelete(pattern: string) {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.unlink(...keys);
      }
    } while (cursor !== '0');
  }
}
