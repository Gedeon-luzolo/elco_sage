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
      // Réessaie 10 fois avec un délai croissant, puis abandonne la connexion
      retryStrategy(times) {
        return times > 10 ? null : times * 50
      },
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
