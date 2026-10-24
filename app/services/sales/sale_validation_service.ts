import Customer from '#models/customer'
import CashSession, { CashSessionStatus } from '#models/cash_session'
import { SalePaymentType } from '#models/sale'
import User, { UserRole, UserStatus } from '#models/user'
import CashSessionService from '#services/sales/cash_session_service'
import type { CreateSaleInput } from '#types/sales'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

interface ValidateCreateSaleProps {
  actor: User
  payload: CreateSaleInput
  theoreticalAmount: number
  discountAmount: number
}

@inject()
export default class SaleValidationService {
  constructor(private cashSessionService: CashSessionService) {}

  /**
   * Valide toutes les contraintes metier avant la creation d'une vente.
   */
  async validateCreateSale(props: ValidateCreateSaleProps): Promise<CashSession> {
    // La vente doit toujours être rattachée à la caisse ouverte, ou à sa caisse si elle a été
    // faite avant la fermeture (vente hors ligne envoyée après coup).
    const cashSession = await this.resolveCashSession(props.payload)

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
   * La caisse est partagée : la session ouverte convient à tous les utilisateurs.
   */
  private async resolveCashSession(payload: CreateSaleInput): Promise<CashSession> {
    // Le client indique la caisse sur laquelle il a vendu : c'est la seule façon de rattacher
    // une vente hors ligne à la bonne caisse si une autre a été ouverte depuis.
    if (payload.cashSessionId) {
      const session = await CashSession.find(payload.cashSessionId)

      if (!session) {
        throw new Error('La session de caisse sélectionnée est invalide.')
      }

      if (session.status === CashSessionStatus.OPEN) {
        return session
      }

      // Une vente faite pendant la session, mais reçue après sa fermeture, reste acceptée :
      // elle a déjà été encaissée et son ticket imprimé.
      if (this.wasSoldDuringSession(session, payload.saleDate)) {
        return session
      }

      throw new Error('La session de caisse est fermée. Ouvrez une nouvelle session pour vendre.')
    }

    // Sans caisse indiquée, la vente va sur la session ouverte lue côté serveur.
    const openSession = await this.cashSessionService.getOpenSession()

    if (!openSession) {
      throw new Error('Ouvrez une session de caisse avant de créer une vente.')
    }

    return openSession
  }

  // Vrai si la date de vente tombe entre l'ouverture et la fermeture de la session.
  private wasSoldDuringSession(session: CashSession, saleDate?: string | Date | null) {
    if (!saleDate || !session.closedAt) {
      return false
    }

    const soldAt =
      saleDate instanceof Date ? DateTime.fromJSDate(saleDate) : DateTime.fromISO(saleDate)

    return soldAt.isValid && soldAt >= session.openedAt && soldAt <= session.closedAt
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
