import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, syncDestination, targets } from '@adonisjs/core/logger'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,

      // Niveau minimal affiché (trace, debug, info, warn, error, fatal)
      level: env.get('LOG_LEVEL'),

      // Hors production, l'écriture est synchrone pour afficher les logs immédiatement
      destination: !app.inProduction ? await syncDestination() : undefined,

      transport: {
        targets: [targets.file({ destination: 1 })],
      },
    },
  },
})

export default loggerConfig

// Types déduits des loggers configurés
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
