import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  // Méthodes dont le corps est lu
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  // Les chaînes vides deviennent null, pour tous les formats
  form: {
    convertEmptyStringsToNull: true,
    types: ['application/x-www-form-urlencoded'],
  },

  json: {
    convertEmptyStringsToNull: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  multipart: {
    autoProcess: true,
    convertEmptyStringsToNull: true,
    processManually: [],
    // Taille maximale d'un envoi multipart
    limit: '20mb',
    types: ['multipart/form-data'],
  },
})

export default bodyParserConfig
