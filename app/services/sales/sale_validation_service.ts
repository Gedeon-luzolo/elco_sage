import Customer from '#models/customer'
import type CashSession from '#models/cash_session'
import { SalePaymentType } from '#models/sale'
import User, { UserRole, UserStatus } from '#models/user'
import CashSessionService from '#services/sales/cash_session_service'
import type { CreateSaleInput } from '#types/sales'

const cashSessionService = new CashSessionService()

interface ValidateCreateSaleProps {
  actor: User
  payload: CreateSaleInput
  theoreticalAmount: number
  discountAmount: number
}

export default class SaleValidationService {
  /**
   * Valide toutes les contraintes metier avant la creation d'une vente.
   */
  async validateCreateSale(props: ValidateCreateSaleProps): Promise<CashSession> {
    // La vente doit toujours etre rattachee a une caisse ouverte du caissier.
    const cashSession = await this.resolveOpenCashSession(props.actor, props.payload.cashSessionId)

    // Ces controles async sont independants, donc on les lance en parallele.
    await Promise.all([
      this.ensurePaymentRules(props.payload),
      this.ensureOperatorIsValid(props.payload.operatorId),
    ])

    // Le controle des montants reste synchrone et lisible hors Promise.all.
    this.ensureSaleAmountsAreValid({
      theoreticalAmount: props.theoreticalAmount,
      discountAmount: props.discountAmount,
    })

    return cashSession
  }

  /**
   * Recupere et valide la session de caisse utilisee pour une vente.
   */
  private async resolveOpenCashSession(actor: User, cashSessionId?: string): Promise<CashSession> {
    // On lit la session depuis le serveur, pas depuis une valeur de confiance frontend.
    const cashSession = await cashSessionService.getOpenSessionForUser(actor.id)

    if (!cashSession) {
      throw new Error('Ouvrez une session de caisse avant de creer une vente.')
    }

    // Si une session est forcee, elle doit rester celle du user connecte.
    if (cashSessionId && cashSession.id !== cashSessionId) {
      throw new Error('La session de caisse selectionnee est invalide ou fermee.')
    }

    return cashSession
  }

  /**
   * Valide les contraintes liees au client et au type de paiement.
   */
  private async ensurePaymentRules(payload: CreateSaleInput) {
    const discountAmount = Number(payload.discountAmount ?? 0)

    // Le client devient obligatoire pour tracer les credits, les offerts et les remises.
    const requiresCustomer =
      payload.paymentType === SalePaymentType.CREDIT ||
      payload.paymentType === SalePaymentType.OFFERED ||
      discountAmount > 0

    if (requiresCustomer && !payload.customerId) {
      throw new Error('Selectionnez un client pour une vente a credit, offerte ou avec remise.')
    }

    if (!payload.customerId) {
      return
    }

    // Si un client est fourni, il doit exister et etre encore actif.
    const customer = await Customer.query()
      .where('id', payload.customerId)
      .where('isActive', true)
      .first()

    if (!customer) {
      throw new Error('Le client selectionné est invalide ou inactif.')
    }
  }

  /**
   * Valide l'operateur selectionne pour la commande.
   */
  private async ensureOperatorIsValid(operatorId: string) {
    // Tous les users actifs peuvent etre operateurs de commande, sauf les admins.
    const operator = await User.query()
      .where('id', operatorId)
      .whereNot('role', UserRole.ADMIN)
      .where('status', UserStatus.ACTIVE)
      .first()

    if (!operator) {
      throw new Error("L'operateur selectionné est invalide, inactif ")
    }
  }

  /**
   * Valide que les montants calcules restent coherents.
   */
  private ensureSaleAmountsAreValid(props: { theoreticalAmount: number; discountAmount: number }) {
    // La remise vient du montant a payer saisi au frontend et ne peut jamais depasser le brut.
    if (props.discountAmount > props.theoreticalAmount) {
      throw new Error('La remise ne peut pas depasser le total de la vente.')
    }
  }
}
