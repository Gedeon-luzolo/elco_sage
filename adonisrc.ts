import { indexEntities } from '@adonisjs/core'
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  // Commandes ace des paquets (les commandes de l'application seraient lues dans ./commands)
  commands: [() => import('@adonisjs/core/commands'), () => import('@adonisjs/lucid/commands')],

  // Fichiers copiés tels quels dans le build : le front compilé (pnpm build:web) est servi par le backend
  metaFiles: [{ pattern: 'web/dist/**', reloadServer: false }],

  // Providers chargés au démarrage de l'application
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/api_provider'),
    () => import('@adonisjs/redis/redis_provider')
  ],

  // Modules importés avant le démarrage
  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel'),
    () => import('#start/vine'),
  ],

  hooks: {
    init: [
      indexEntities({
        transformers: { enabled: true },
      }),
    ],
  },
})
