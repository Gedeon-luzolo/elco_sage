import logger from '@adonisjs/core/services/logger'
import redis from '@adonisjs/redis/services/main'

// Préfixe commun qui isole le cache applicatif des autres usages de Redis (sessions, compteurs).
const CACHE_PREFIX = 'cache:'

export default class CacheService {
  // Retourne la valeur du cache ou exécute le loader si la clé est absente/expirée.
  async remember<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    // Évite de relancer une requête coûteuse tant que la valeur est valide.
    const cached = await this.get<T>(key)

    if (cached !== undefined) {
      return cached
    }

    // Si la valeur est absente ou expirée, on exécute le loader pour la recalculer et la stocker.
    const value = await loader()
    await this.set(key, value, ttlMs)

    return value
  }

  // Lit une valeur depuis Redis. Une panne Redis ne doit jamais casser une lecture : on retombe sur la base.
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = await redis.get(CACHE_PREFIX + key)

      if (raw === null) {
        return undefined
      }

      return JSON.parse(raw) as T
    } catch (error) {
      logger.warn({ err: error, key }, 'Lecture du cache impossible')
      return undefined
    }
  }

  // Enregistre une valeur dans Redis pour une durée donnée (PX = millisecondes).
  async set<T>(key: string, value: T, ttlMs: number) {
    try {
      await redis.set(CACHE_PREFIX + key, JSON.stringify(value), 'PX', ttlMs)
    } catch (error) {
      logger.warn({ err: error, key }, 'Écriture du cache impossible')
    }
  }

  // Supprime toutes les clés d'un domaine fonctionnel.
  async forgetByPrefix(prefix: string) {
    try {
      // SCAN évite de bloquer Redis, contrairement à KEYS.
      const stream = redis.connection().scanStream({
        match: `${CACHE_PREFIX}${prefix}*`,
        count: 100,
      })

      for await (const keys of stream) {
        if (keys.length > 0) {
          await redis.unlink(...keys)
        }
      }
    } catch (error) {
      logger.warn({ err: error, prefix }, 'Invalidation du cache impossible')
    }
  }
}
