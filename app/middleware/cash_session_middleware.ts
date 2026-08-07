import CashSessionService from '#services/sales/cash_session_service'
import { isManagementRole } from '#utils/user_role_utils'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const cashSessionService = new CashSessionService()
const READ_METHODS = ['GET', 'HEAD']
const OPENING_PATHS = ['/sales/session/open']

export default class CashSessionMiddleware {
  /**
   * Controle l'acces au module vente selon la session de caisse active.
   * Les profils direction peuvent consulter sans session, mais pas ecrire.
   */
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.redirect().toRoute('session.create')
    }

    // La page et l'action d'ouverture doivent rester accessibles sans session active.
    const requestPath = ctx.request.url().split('?')[0]

    if (OPENING_PATHS.includes(requestPath)) {
      return next()
    }

    const openSession = await cashSessionService.getOpenSessionForUser(user.id)
    if (openSession) {
      return next()
    }

    const isManagementUser = isManagementRole(user.role)
    const isReadRequest = READ_METHODS.includes(ctx.request.method())

    // Admin et directeur gardent l'acces lecture aux ventes meme sans caisse ouverte.
    if (isManagementUser && isReadRequest) {
      return next()
    }

    // Les ecritures restent bloquees cote serveur quand aucune caisse n'est ouverte.
    if (isManagementUser) {
      ctx.session.flash('error', 'Ouvrez une session de caisse avant de modifier les ventes.')
      return ctx.response.redirect().back()
    }

    return ctx.response.redirect().toRoute('sales.cash_sessions.create')
  }
}
