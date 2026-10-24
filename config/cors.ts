import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,

  // En développement toutes les origines passent ; en production, seules celles de CORS_ORIGINS
  origin: app.inDev ? true : env.get('CORS_ORIGINS', '').split(',').filter(Boolean),

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  // Reprend les en-têtes demandés par le navigateur
  headers: true,

  exposeHeaders: [],

  // Autorise l'en-tête Authorization sur les requêtes entre origines
  credentials: true,

  // Durée de mise en cache de la requête de pré-vérification, en secondes
  maxAge: 90,
})

export default corsConfig
