import { JournalisationModule } from '#models/journalisation'
import Sale, { SalePaymentType, SaleStatus } from '#models/sale'
import SaleRecovery from '#models/sale_recovery'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import CashSessionService from '#services/sales/cash_session_service'
import type { CreateSaleRecoveryInput } from '#types/sales'
import { DateTime } from 'luxon'

const journalisationService = new JournalisationService()
const cashSessionService = new CashSessionService()

export default class SaleRecoveryService {
  /**
   * Enregistre un recouvrement sur une vente a credit.
   */
  async create(actor: User, saleId: string, payload: CreateSaleRecoveryInput) {
    const sale = await Sale.findOrFail(saleId)

    // Les recouvrements concernent uniquement les ventes a credit encore actives.
    this.ensureSaleCanReceiveRecovery(sale)

    const cashSession = await cashSessionService.getOpenSessionForUser(actor.id)
    if (!cashSession) {
      throw new Error('Ouvrez une session de caisse avant de faire un recouvrement.')
    }

    const recovery = await SaleRecovery.create({
      saleId: sale.id,
      cashSessionId: cashSession.id,
      receivedById: actor.id,
      amount: Number(payload.amount),
      currency: payload.currency,
      recoveredAt: this.resolveRecoveredAt(payload.recoveredAt),
    })

    await journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Recouvrement de ${payload.amount} ${payload.currency} enregistre sur l'addition ${sale.additionNumber} par ${actor.fullName ?? actor.email}.`,
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
      throw new Error('Impossible de recouvrer une vente annulee.')
    }

    if (sale.paymentType !== SalePaymentType.CREDIT) {
      throw new Error('Les recouvrements sont reserves aux ventes a credit.')
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
