import { defineConfig } from '@adonisjs/core/http'

/**
 * La configuration du serveur HTTP : l'API ne sert que du JSON avec un token Bearer,
 * sans redirection, sans cookie ni formulaire HTML.
 */
export const http = defineConfig({
  /**
   * Génère un identifiant unique par requête, pour relier les logs d'une même requête.
   */
  generateRequestId: true,

  /**
   * Garde le contexte HTTP accessible uniquement via les paramètres des méthodes.
   */
  useAsyncLocalStorage: false,
})
