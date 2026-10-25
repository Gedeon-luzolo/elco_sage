import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'
import { InferConnections } from '@adonisjs/redis/types'

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    // Connexion par défaut, utilisée pour le cache applicatif
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      // Numéro de la base logique Redis, lu depuis l'environnement
      db: env.get('REDIS_DB'),
      keyPrefix: '',
      // Réessaie sans abandonner, avec un délai croissant plafonné à 2 secondes
      retryStrategy(times) {
        return Math.min(times * 50, 2000)
      },
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
