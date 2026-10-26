import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS } from '../redis/redis.module.js';

// Préfixe commun qui isole le cache applicatif des autres usages de Redis (tokens).
const CACHE_PREFIX = 'cache:';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /**
   * Retourne la valeur du cache, ou exécute le loader si la clé est absente ou expirée.
   * La valeur doit être un objet simple : elle passe par JSON.
   */
  async remember<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== undefined) {
      return cached;
    }

    // Valeur absente ou expirée : on la recalcule puis on la garde.
    const value = await loader();
    await this.set(key, value, ttlMs);

    return value;
  }

  /**
   * Lit une valeur. Une panne Redis ne casse jamais une lecture : on retombe sur la base.
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = await this.redis.get(CACHE_PREFIX + key);

      return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch (error) {
      this.logger.warn(
        `Lecture du cache impossible (${key}) : ${String(error)}`,
      );
      return undefined;
    }
  }

  /**
   * Enregistre une valeur pour une durée donnée (PX = millisecondes).
   */
  async set<T>(key: string, value: T, ttlMs: number) {
    try {
      await this.redis.set(
        CACHE_PREFIX + key,
        JSON.stringify(value),
        'PX',
        ttlMs,
      );
    } catch (error) {
      this.logger.warn(
        `Écriture du cache impossible (${key}) : ${String(error)}`,
      );
    }
  }

  /**
   * Supprime toutes les clés d'un domaine fonctionnel.
   */
  async forgetByPrefix(prefix: string) {
    try {
      // SCAN évite de bloquer Redis, contrairement à KEYS.
      const stream = this.redis.scanStream({
        match: `${CACHE_PREFIX}${prefix}*`,
        count: 100,
      });

      for await (const keys of stream as AsyncIterable<string[]>) {
        if (keys.length > 0) {
          await this.redis.unlink(...keys);
        }
      }
    } catch (error) {
      this.logger.warn(
        `Invalidation du cache impossible (${prefix}) : ${String(error)}`,
      );
    }
  }
}
