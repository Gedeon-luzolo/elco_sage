import CashSession, { CashSessionStatus } from '#models/cash_session'
import { JournalisationModule } from '#models/journalisation'
import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import type User from '#models/user'
import { CacheKeys } from '#services/cache/cache_keys'
import CacheService from '#services/cache/cache_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import { Currency } from '#types/currency'
import { normalizeDateRange } from '#utils/date_utils'
import { buildDifferenceMoneyMap, buildMoneyMap, type MoneyMap } from '#utils/money_map'
import { isManagementRole } from '#utils/user_role_utils'
import type { CloseCashSessionInput } from '#validators/cash_session'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

export interface CashSessionSystemAmounts {
  systemAmounts: MoneyMap
}

export interface FindCashSessionsParams {
  startDate?: string
  endDate?: string
}

@inject()
export default class CashSessionService {
  constructor(
    private journalisationService: JournalisationService,
    private cacheService: CacheService
  ) {}

  /**
   * Recupere la session de caisse ouverte pour un utilisateur.
   */
  async getOpenSessionForUser(userId: string) {
    // Une seule session OPEN est autorisee par utilisateur grace a l'index unique partiel.
    return CashSession.query()
      .where('userId', userId)
      .where('status', CashSessionStatus.OPEN)
      .orderBy('openedAt', 'desc')
      .first()
  }

  /**
   * Recupere les sessions de caisse visibles par l'utilisateur courant.
   */
  async findVisibleSessions(actor: User, params: FindCashSessionsParams = {}) {
    const query = CashSession.query().preload('user').orderBy('openedAt', 'desc')

    // Les admins et directeurs voient toutes les sessions; les autres voient uniquement les leurs.
    if (!isManagementRole(actor.role)) {
      query.where('userId', actor.id)
    }

    // La periode couvre les journees completes selectionnees.
    if (params.startDate && params.endDate) {
      const dateRange = normalizeDateRange(params.startDate, params.endDate)

      query.whereBetween('openedAt', [dateRange.startDate, dateRange.endDate])
    }

    return query
  }

  /**
   * Ouvre une nouvelle session de caisse pour l'utilisateur connecte.
   */
  async open(actor: User) {
    // Evite un message SQL brut si une session active existe deja.
    const existingSession = await this.getOpenSessionForUser(actor.id)
    if (existingSession) {
      return existingSession
    }

    // La date et l'heure d'ouverture viennent du serveur pour rester fiables.
    const now = DateTime.now()
    const cashSession = await CashSession.create({
      userId: actor.id,
      status: CashSessionStatus.OPEN,
      openedAt: now,
      closedAt: null,
      systemAmounts: null,
      closingAmounts: null,
      differenceAmounts: null,
    })

    // Journaliser l'operation
    await this.journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Session de caisse ouverte par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    // Invalider le cache pour forcer la lecture depuis la base de données
    this.invalidateCashSessionDomains()

    return cashSession
  }

  /**
   * Ferme la session de caisse ouverte de l'utilisateur connecte.
   */
  async close(actor: User, payload: CloseCashSessionInput) {
    const cashSession = await this.getOpenSessionForUser(actor.id)

    if (!cashSession) {
      throw new Error("Aucune session de caisse ouverte n'a ete trouvee.")
    }

    const closingAmountCdf = this.resolveClosingAmount(payload.closingAmountCdf)
    const closingAmountUsd = this.resolveClosingAmount(payload.closingAmountUsd)

    // La caisse peut etre cloturée avec une seule devise, mais pas sans montant.
    if (closingAmountCdf === null && closingAmountUsd === null) {
      throw new Error('Saisissez au moins un montant de cloture.')
    }

    // Le serveur recalcule toujours le theorique final avant d'enregistrer la cloture.
    const { systemAmounts } = await this.computeSystemAmounts(cashSession)
    const closingAmounts = buildMoneyMap({
      [Currency.CDF]: closingAmountCdf,
      [Currency.USD]: closingAmountUsd,
    })
    const differenceAmounts = buildDifferenceMoneyMap(closingAmounts, systemAmounts)

    // La fermeture complete la session existante au lieu d'en creer une autre.
    cashSession.status = CashSessionStatus.CLOSED
    cashSession.closedAt = DateTime.now()
    cashSession.systemAmounts = systemAmounts
    cashSession.closingAmounts = closingAmounts
    cashSession.differenceAmounts = differenceAmounts
    await cashSession.save()

    // Journaliser l'operation
    await this.journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Session de caisse fermée par ${actor.fullName ?? actor.email}. Ecart: ${JSON.stringify(differenceAmounts)}.`,
      user: actor,
    })

    this.invalidateCashSessionDomains()

    return cashSession
  }

  // Invalide le cache des domaines dependants de la session de caisse pour forcer la lecture depuis la base de données.
  private invalidateCashSessionDomains() {
    this.cacheService.forgetByPrefix(CacheKeys.cashSessions.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.sales.prefix)
  }

  /**
   * Calcule les montants attendus dans la caisse, separement par devise.
   */
  async computeSystemAmounts(cashSession: CashSession): Promise<CashSessionSystemAmounts> {
    // On ne convertit pas les montants: chaque devise garde son total systeme.
    const [cashSalesCdf, cashSalesUsd, recoveriesCdf, recoveriesUsd] = await Promise.all([
      this.sumCashSales(cashSession.id, Currency.CDF),
      this.sumCashSales(cashSession.id, Currency.USD),
      this.sumRecoveries(cashSession.id, Currency.CDF),
      this.sumRecoveries(cashSession.id, Currency.USD),
    ])

    return {
      systemAmounts: {
        [Currency.CDF]: cashSalesCdf + recoveriesCdf,
        [Currency.USD]: cashSalesUsd + recoveriesUsd,
      },
    }
  }

  private resolveClosingAmount(value: string | number | null | undefined) {
    // Vine peut typer le nombre comme string | number selon la source du formulaire.
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null
    }

    return Number(value)
  }

  // Sommer les ventes cash actives de la session courante, par devise.
  private async sumCashSales(cashSessionId: string, currency: Currency) {
    // Seules les ventes cash actives representent de l'argent attendu en caisse.
    const result = await Sale.query()
      .where('cashSessionId', cashSessionId)
      .where('paymentType', SalePaymentType.CASH)
      .where('status', SaleStatus.ACTIVE)
      .where('currency', currency)
      .sum('total_amount as total')
      .first()

    return Number(result?.$extras.total ?? 0)
  }

  // Les recouvrements sont des encaissements reels de la session courante.
  private async sumRecoveries(cashSessionId: string, currency: Currency) {
    // Les recouvrements sont des encaissements reels de la session courante.
    const result = await SaleRecovery.query()
      .where('cashSessionId', cashSessionId)
      .where('currency', currency)
      .sum('amount as total')
      .first()

    return Number(result?.$extras.total ?? 0)
  }
}
