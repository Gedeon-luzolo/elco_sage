import CashSession, { CashSessionStatus } from '#models/cash_session'
import { JournalisationModule } from '#models/journalisation'
import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import type User from '#models/user'
import { CacheKeys } from '#services/cache/cache_keys'
import CacheService from '#services/cache/cache_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import { Currency } from '#types/currency'
import { BUSINESS_TIME_ZONE, normalizeDateRange } from '#utils/date_utils'
import { buildDifferenceMoneyMap, buildMoneyMap, type MoneyMap } from '#utils/money_map'
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
   * Récupère la session de caisse ouverte : il n'y en a qu'une seule à la fois, pour tous.
   */
  async getOpenSession() {
    // L'index unique partiel garantit qu'au plus une session est ouverte.
    return CashSession.query()
      .where('status', CashSessionStatus.OPEN)
      .preload('openedBy')
      .orderBy('openedAt', 'desc')
      .first()
  }

  /**
   * Récupère les sessions de caisse, de la plus récente à la plus ancienne.
   * La caisse est partagee : tous les utilisateurs voient toutes les sessions.
   */
  async findSessions(params: FindCashSessionsParams = {}) {
    const query = CashSession.query()
      .preload('openedBy')
      .preload('closedBy')
      .orderBy('openedAt', 'desc')

    // La periode couvre les journees completes selectionnees.
    if (params.startDate && params.endDate) {
      const dateRange = normalizeDateRange(params.startDate, params.endDate)

      query.whereBetween('openedAt', [dateRange.startDate, dateRange.endDate])
    }

    return query
  }

  /**
   * Ouvre une nouvelle session de caisse, à condition que la précédente soit fermée.
   */
  async open(actor: User) {
    // Une seule session ouverte à la fois : on dit qui l'a ouverte et depuis quand.
    const existingSession = await this.getOpenSession()
    if (existingSession) {
      throw new Error(this.buildAlreadyOpenMessage(existingSession))
    }

    // La date et l'heure d'ouverture viennent du serveur pour rester fiables.
    const now = DateTime.now()
    let cashSession: CashSession
    try {
      cashSession = await CashSession.create({
        openedById: actor.id,
        closedById: null,
        status: CashSessionStatus.OPEN,
        openedAt: now,
        closedAt: null,
        systemAmounts: null,
        closingAmounts: null,
        differenceAmounts: null,
      })
    } catch (error) {
      // Deux ouvertures simultanées : l'index unique refuse la seconde (violation d'unicité)
      if ((error as { code?: string }).code === '23505') {
        const openedSession = await this.getOpenSession()
        throw new Error(
          openedSession
            ? this.buildAlreadyOpenMessage(openedSession)
            : 'Une session de caisse est déjà ouverte.'
        )
      }

      throw error
    }

    // Journaliser l'opération
    await this.journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Session de caisse ouverte par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    // Invalider le cache pour forcer la lecture depuis la base de données
    await this.invalidateCashSessionDomains()

    await cashSession.load('openedBy')

    return cashSession
  }

  // Message affiche quand on tente d'ouvrir une session alors qu'une autre est encore ouverte.
  private buildAlreadyOpenMessage(session: CashSession) {
    const openedBy = session.openedBy?.fullName ?? session.openedBy?.email ?? 'un utilisateur'
    const openedAt = session.openedAt.setZone(BUSINESS_TIME_ZONE).toFormat("dd/MM/yyyy 'à' HH:mm")

    return `Une session de caisse est déjà ouverte par ${openedBy} depuis le ${openedAt}. Fermez-la avant d'en ouvrir une nouvelle.`
  }

  /**
   * Ferme la session de caisse ouverte : n'importe quel utilisateur peut la fermer.
   */
  async close(actor: User, payload: CloseCashSessionInput) {
    const cashSession = await this.getOpenSession()

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
    cashSession.closedById = actor.id
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

    await this.invalidateCashSessionDomains()

    return cashSession
  }

  // Invalide le cache des domaines dependants de la session de caisse pour forcer la lecture depuis la base de données.
  private async invalidateCashSessionDomains() {
    await this.cacheService.forgetByPrefix(CacheKeys.cashSessions.prefix)
    await this.cacheService.forgetByPrefix(CacheKeys.sales.prefix)
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
