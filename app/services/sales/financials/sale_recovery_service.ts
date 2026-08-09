import { JournalisationModule } from '#models/journalisation'
import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import CashSessionService from '#services/sales/cash_session_service'
import DebtService from '#services/sales/financials/debt_service'
import type {
  DebtStats,
  FindDebtsParams,
  RecoveryOverview,
  RecoveryPaymentSummary,
} from '#types/debt'
import type { CreateSaleRecoveryInput } from '#types/sales'
import { normalizeDateRange } from '#utils/date_utils'
import { normalizeMoneyMap, sumMoneyByCurrency } from '#utils/money_map'
import { resolveDebtStatus } from '#utils/sale_debt.utils'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

@inject()
export default class SaleRecoveryService {
  constructor(
    private journalisationService: JournalisationService,
    private cashSessionService: CashSessionService,
    private debtService: DebtService
  ) {}

  /**
   * Enregistre un recouvrement sur une vente à crédit.
   */
  async create(actor: User, saleId: string, payload: CreateSaleRecoveryInput) {
    const sale = await Sale.query().where('id', saleId).preload('recoveries').firstOrFail()

    // Les recouvrements concernent uniquement les ventes à crédit encore actives.
    this.ensureSaleCanReceiveRecovery(sale)
    this.ensureRecoveryCurrencyMatchesSale(sale, payload)
    this.ensureRecoveryDoesNotExceedRemainingAmount(sale, payload)

    const cashSession = await this.cashSessionService.getOpenSessionForUser(actor.id)
    if (!cashSession) {
      throw new Error('Ouvrez une session de caisse avant de faire un recouvrement.')
    }

    // Le recouvrement est enregistré dans la base de données avec l'agent et la caisse active.
    const recovery = await SaleRecovery.create({
      saleId: sale.id,
      cashSessionId: cashSession.id,
      receivedById: actor.id,
      amount: Number(payload.amount),
      currency: payload.currency,
      recoveredAt: this.resolveRecoveredAt(payload.recoveredAt),
    })

    // Le recouvrement est journalisé pour conserver une trace d'audit lisible.
    await this.journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Recouvrement de ${payload.amount} ${payload.currency} enregistré sur l'addition ${sale.additionNumber} par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return recovery
  }

  /**
   * Récupère l'historique des paiements de dettes sur la période demandée.
   */
  async getOverview(params: FindDebtsParams = {}): Promise<RecoveryOverview> {
    // On charge les paiements réels, pas les ventes soldées, car une même dette peut avoir
    // plusieurs lignes de paiement dans l'historique de recouvrement.
    const recoveries = await this.findRecoveries(params)

    // Chaque paiement est enrichi avec l'état de la dette au moment de ce paiement:
    // montant payé sur la ligne, cumul payé, reste à payer et statut.
    const history = recoveries.map((recovery) => this.buildRecoveryPaymentSummary(recovery))

    return {
      recoveries: history,
      stats: this.buildRecoveryStats(history),
    }
  }

  private async findRecoveries({ startDate, endDate }: FindDebtsParams = {}) {
    // La requête part de sale_recoveries pour afficher une ligne par paiement.
    // On limite aux ventes à crédit actives, car les recouvrements ne concernent pas
    // les ventes cash, offertes ou annulées.
    const query = SaleRecovery.query()
      .whereHas('sale', (saleQuery) => {
        saleQuery.where('paymentType', SalePaymentType.CREDIT).where('status', SaleStatus.ACTIVE)
      })
      .preload('receivedBy')
      .preload('cashSession')
      .preload('sale', (saleQuery) => {
        saleQuery
          .preload('customer')
          .preload('operator')
          .preload('seller')
          .preload('items', (itemsQuery) => {
            itemsQuery.preload('productService')
          })
          .preload('recoveries', (recoveriesQuery) => {
            // Les paiements de la dette sont triés en ordre chronologique pour calculer
            // correctement le cumul payé après la ligne courante.
            recoveriesQuery.preload('receivedBy').orderBy('recoveredAt', 'asc')
          })
      })
      .orderBy('recoveredAt', 'desc')

    // Sur cette page, la période filtre les dates de paiement, pas les dates de vente.
    if (startDate && endDate) {
      const dateRange = normalizeDateRange(startDate, endDate)

      query.whereBetween('recoveredAt', [dateRange.startDate, dateRange.endDate])
    }

    return query
  }

  private buildRecoveryPaymentSummary(recovery: SaleRecovery): RecoveryPaymentSummary {
    const sale = recovery.sale as Sale
    const debtTotalAmount = Number(sale.totalAmount || 0)

    // On retrie localement pour garder le calcul robuste, même si une autre partie du code
    // change l'ordre du preload plus tard.
    const saleRecoveries = [...(sale.recoveries ?? [])].sort(
      (first, second) => first.recoveredAt.toMillis() - second.recoveredAt.toMillis()
    )
    let paidAfterAmount = 0

    // On additionne les paiements de la même devise jusqu'au paiement courant.
    // Cela donne le "total payé" visible sur la ligne d'historique.
    for (const saleRecovery of saleRecoveries) {
      if (saleRecovery.currency === sale.currency) {
        paidAfterAmount += Number(saleRecovery.amount || 0)
      }

      // Dès que la ligne courante est atteinte, on s'arrête pour obtenir le reste
      // après ce paiement précis, pas le reste final de la dette.
      if (saleRecovery.id === recovery.id) {
        break
      }
    }

    // Math.max évite d'afficher un reste négatif si une ancienne donnée contient
    // un paiement égal ou légèrement supérieur au total de la dette.
    const remainingAmount = Math.max(debtTotalAmount - paidAfterAmount, 0)

    return {
      recovery,
      sale,
      debtTotalAmount,
      paidAmount: Number(recovery.amount || 0),
      paidAfterAmount,
      remainingAmount,
      debtStatus: resolveDebtStatus(debtTotalAmount, paidAfterAmount),
    }
  }

  private buildRecoveryStats(recoveries: RecoveryPaymentSummary[]): DebtStats {
    const uniqueSales = new Map<string, RecoveryPaymentSummary>()

    // Les paiements sont triés du plus récent au plus ancien. On garde donc le premier
    // paiement rencontré par vente pour représenter le reste actuel de cette dette.
    for (const recovery of recoveries) {
      if (!uniqueSales.has(recovery.sale.id)) {
        uniqueSales.set(recovery.sale.id, recovery)
      }
    }

    const latestRecoveriesBySale = [...uniqueSales.values()]

    // La valeur des dettes concernées ne doit compter chaque vente qu'une seule fois,
    // même si elle contient plusieurs paiements dans la période.
    const totalDebtAmounts = sumMoneyByCurrency(
      latestRecoveriesBySale,
      (recovery) => recovery.sale.currency,
      (recovery) => recovery.debtTotalAmount
    )

    // Le total recouvré additionne toutes les lignes de paiement affichées.
    const recoveredAmounts = sumMoneyByCurrency(
      recoveries,
      (recovery) => recovery.recovery.currency,
      (recovery) => recovery.paidAmount
    )

    // Le reste à payer de la card doit représenter l'état actuel des dettes concernées.
    // On utilise donc tous les paiements de la vente, même ceux qui ne sont pas dans
    // la période filtrée, sinon une période ancienne afficherait un reste dépassé.
    const remainingAmounts = sumMoneyByCurrency(
      latestRecoveriesBySale,
      (recovery) => recovery.sale.currency,
      (recovery) => this.getCurrentRemainingAmount(recovery.sale)
    )

    // Normalise les clés de devise avant d'exposer les stats au frontend.
    return {
      totalDebts: recoveries.length,
      totalDebtAmounts: normalizeMoneyMap(totalDebtAmounts),
      recoveredAmounts: normalizeMoneyMap(recoveredAmounts),
      remainingAmounts: normalizeMoneyMap(remainingAmounts),
    }
  }

  // Calcule le reste actuel d'une vente à crédit, en tenant compte de tous les paiements
  private getCurrentRemainingAmount(sale: Sale) {
    const debtTotalAmount = Number(sale.totalAmount || 0)
    const recoveredAmount = (sale.recoveries ?? [])
      .filter((recovery) => recovery.currency === sale.currency)
      .reduce((total, recovery) => total + Number(recovery.amount || 0), 0)
    // Math.max évite d'afficher un reste négatif si une ancienne donnée contient
    return Math.max(debtTotalAmount - recoveredAmount, 0)
  }

  // Refuse les recouvrements sur les ventes cash, offertes ou annulées.
  private ensureSaleCanReceiveRecovery(sale: Sale) {
    if (sale.status === SaleStatus.CANCELLED) {
      throw new Error('Impossible de recouvrer une vente annulée.')
    }

    if (sale.paymentType !== SalePaymentType.CREDIT) {
      throw new Error('Les recouvrements sont réservés aux ventes à crédit.')
    }
  }

  // Une dette se paie dans la devise de la vente pour éviter les conversions implicites.
  private ensureRecoveryCurrencyMatchesSale(sale: Sale, payload: CreateSaleRecoveryInput) {
    if (payload.currency !== sale.currency) {
      throw new Error('Le paiement doit être effectué dans la devise de la vente.')
    }
  }

  // Le montant encaissé ne peut pas dépasser le reste dû.
  private ensureRecoveryDoesNotExceedRemainingAmount(sale: Sale, payload: CreateSaleRecoveryInput) {
    const debt = this.debtService.buildDebtSummary(sale)
    const recoveryAmount = Number(payload.amount)

    if (recoveryAmount > debt.remainingAmount) {
      throw new Error('Le paiement dépasse le reste de la dette.')
    }
  }

  // Convertit la date reçue en DateTime, ou utilise l'heure serveur.
  private resolveRecoveredAt(recoveredAt?: string | Date | null) {
    if (!recoveredAt) {
      return DateTime.now()
    }

    // On accepte les dates ISO ou les objets Date, mais pas les chaînes arbitraires.
    if (recoveredAt instanceof Date) {
      return DateTime.fromJSDate(recoveredAt)
    }

    return DateTime.fromISO(recoveredAt)
  }
}
