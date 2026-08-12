import CashSessionService from '#services/sales/cash_session_service'
import { isManagementRole } from '#utils/user_role_utils'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const READ_METHODS = ['GET', 'HEAD']
const OPENING_PATHS = ['/sales/session/open']
const SALE_CANCEL_PATH_PATTERN = /^\/sales\/[^/]+\/cancel$/

@inject()
export default class CashSessionMiddleware {
  constructor(private cashSessionService: CashSessionService) {}

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

    const openSession = await this.cashSessionService.getOpenSessionForUser(user.id)
    if (openSession) {
      return next()
    }

    const isManagementUser = isManagementRole(user.role)
    const isReadRequest = READ_METHODS.includes(ctx.request.method())
    const isSaleCancelRequest =
      ctx.request.method() === 'PATCH' && SALE_CANCEL_PATH_PATTERN.test(requestPath)

    // Admin et directeur gardent l'acces lecture aux ventes meme sans caisse ouverte.
    if (isManagementUser && isReadRequest) {
      return next()
    }

    // Admin et directeur peuvent annuler une vente depuis un autre poste sans ouvrir leur propre caisse.
    if (isManagementUser && isSaleCancelRequest) {
      return next()
    }

    // Les ecritures restent bloquées cote serveur quand aucune caisse n'est ouverte.
    if (isManagementUser) {
      ctx.session.flash('error', 'Ouvrez une session de caisse avant de modifier les ventes.')
      return ctx.response.redirect().back()
    }

    return ctx.response.redirect().toRoute('sales.cash_sessions.create')
  }
}
