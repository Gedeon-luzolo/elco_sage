import app from '@adonisjs/core/services/app'
import { ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  // En développement, les erreurs sont détaillées avec la pile d'appels
  protected debug = !app.inProduction
}
