import { JournalisationModule } from '#models/journalisation'
import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import CashSessionService from '#services/sales/cash_session_service'
import DebtService from '#services/sales/debt_service'
import type { CreateSaleRecoveryInput } from '#types/sales'
import { DateTime } from 'luxon'

const journalisationService = new JournalisationService()
const cashSessionService = new CashSessionService()
const debtService = new DebtService()

export default class SaleRecoveryService {
  /**
   * Enregistre un recouvrement sur une vente a credit.
   */
  async create(actor: User, saleId: string, payload: CreateSaleRecoveryInput) {
    const sale = await Sale.query().where('id', saleId).preload('recoveries').firstOrFail()

    // Les recouvrements concernent uniquement les ventes a credit encore actives.
    this.ensureSaleCanReceiveRecovery(sale)
    this.ensureRecoveryCurrencyMatchesSale(sale, payload)
    this.ensureRecoveryDoesNotExceedRemainingAmount(sale, payload)

    const cashSession = await cashSessionService.getOpenSessionForUser(actor.id)
    if (!cashSession) {
      throw new Error('Ouvrez une session de caisse avant de faire un recouvrement.')
    }

    // Le recouvrement est enregistre dans la base de donnees.
    const recovery = await SaleRecovery.create({
      saleId: sale.id,
      cashSessionId: cashSession.id,
      receivedById: actor.id,
      amount: Number(payload.amount),
      currency: payload.currency,
      recoveredAt: this.resolveRecoveredAt(payload.recoveredAt),
    })

    // Le recouvrement est journalise pour l'audit.
    await journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Recouvrement de ${payload.amount} ${payload.currency} enregistré sur l'addition ${sale.additionNumber} par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return recovery
  }

  /**
   * Recupere les recouvrements d'une vente.
   */
  async findBySale(saleId: string) {
    // Les relations donnent le caissier et la session ayant encaisse le paiement.
    return SaleRecovery.query()
      .where('saleId', saleId)
      .preload('cashSession')
      .preload('receivedBy')
      .orderBy('recoveredAt', 'desc')
  }

  // Refuse les recouvrements sur les ventes cash, offertes ou annulees.
  private ensureSaleCanReceiveRecovery(sale: Sale) {
    if (sale.status === SaleStatus.CANCELLED) {
      throw new Error('Impossible de recouvrer une vente annulée.')
    }

    if (sale.paymentType !== SalePaymentType.CREDIT) {
      throw new Error('Les recouvrements sont réservés aux ventes à crédit.')
    }
  }

  // Une dette se paie dans la devise de la vente pour eviter les conversions implicites.
  private ensureRecoveryCurrencyMatchesSale(sale: Sale, payload: CreateSaleRecoveryInput) {
    if (payload.currency !== sale.currency) {
      throw new Error('Le paiement doit etre effectue dans la devise de la vente.')
    }
  }

  // Le montant encaisse ne peut pas depasser le reste du.
  private ensureRecoveryDoesNotExceedRemainingAmount(sale: Sale, payload: CreateSaleRecoveryInput) {
    const debt = debtService.buildDebtSummary(sale)
    const recoveryAmount = Number(payload.amount)

    if (recoveryAmount > debt.remainingAmount) {
      throw new Error('Le paiement depasse le reste de la dette.')
    }
  }

  // Convertit la date recue en DateTime, ou utilise l'heure serveur.
  private resolveRecoveredAt(recoveredAt?: string | Date | null) {
    if (!recoveredAt) {
      return DateTime.now()
    }

    if (recoveredAt instanceof Date) {
      return DateTime.fromJSDate(recoveredAt)
    }

    return DateTime.fromISO(recoveredAt)
  }
}
