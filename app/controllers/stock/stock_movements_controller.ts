import type {} from '../../../.adonisjs/server/pages.js'
import type { HttpContext } from '@adonisjs/core/http'
import StockMovementService from '#services/stock/stock_movement_service'
import {
  createStockMovementValidator,
  validatePhysicalStockValidator,
} from '#validators/stock_movement'
import { runAction } from '#utils/error_handler'

const stockMovementService = new StockMovementService()

// URL de redirection commune après toute mutation réussie
const REDIRECT_URL = '/stock'

export default class StockMovementsController {
  /**
   * Affiche la page de gestion du stock journalier.
   * Par défaut, affiche le stock du jour.
   */
  async index({ inertia, request }: HttpContext) {
    const date = request.input('date', new Date().toISOString().split('T')[0])

    const dailyStock = await stockMovementService.getDailyStock({ date })

    return (inertia.render as any)('stock/stock_movements_page', {
      stockItems: dailyStock,
      currentDate: date,
    })
  }

  /**
   * Crée ou met à jour un mouvement de stock (entrées uniquement).
   */
  async store(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(createStockMovementValidator)

    return runAction(ctx, () => stockMovementService.createOrUpdate(actor, payload), {
      successMessage: 'Entrées de stock enregistrées avec succès.',
      errorMessage: "Impossible d'enregistrer les entrées de stock.",
      redirectTo: REDIRECT_URL,
    })
  }

  /**
   * Valide le stock physique et les pertes pour un produit à une date donnée.
   * Cette action débloque le jour suivant.
   */
  async validatePhysicalStock(ctx: HttpContext) {
    const actor = ctx.auth.getUserOrFail()
    const payload = await ctx.request.validateUsing(validatePhysicalStockValidator)

    return runAction(ctx, () => stockMovementService.validatePhysicalStock(actor, payload), {
      successMessage: 'Stock physique validé avec succès.',
      errorMessage: 'Impossible de valider le stock physique.',
      redirectTo: REDIRECT_URL,
    })
  }
}
