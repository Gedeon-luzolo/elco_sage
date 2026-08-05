import CashSession, { CashSessionStatus } from '#models/cash_session'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import type {
  CloseCashSessionInput,
  OpenCashSessionInput,
} from '#validators/cash_session'
import { DateTime } from 'luxon'

const journalisationService = new JournalisationService()

export default class CashSessionService {
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
   * Ouvre une nouvelle session de caisse pour l'utilisateur connecte.
   */
  async open(actor: User, payload: OpenCashSessionInput) {
    // Evite un message SQL brut si une session active existe deja.
    const existingSession = await this.getOpenSessionForUser(actor.id)
    if (existingSession) {
      return existingSession
    }

    // La date et l'heure d'ouverture viennent du serveur pour rester fiables.
    const now = DateTime.now()
    const openingAmount = Number(payload.openingAmount ?? 0)
    const cashSession = await CashSession.create({
      userId: actor.id,
      status: CashSessionStatus.OPEN,
      openedAt: now,
      openingAmount,
      openingCurrency: payload.openingCurrency,
      closingAmount: null,
      closingCurrency: null,
      closedAt: null,
    })

    await journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Session de caisse ouverte par ${actor.fullName ?? actor.email} avec ${openingAmount} ${payload.openingCurrency}.`,
      user: actor,
    })

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

    // La fermeture complete la session existante au lieu d'en creer une autre.
    cashSession.status = CashSessionStatus.CLOSED
    cashSession.closedAt = DateTime.now()
    cashSession.closingAmount = Number(payload.closingAmount)
    cashSession.closingCurrency = payload.closingCurrency
    await cashSession.save()

    await journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Session de caisse fermee par ${actor.fullName ?? actor.email} avec ${payload.closingAmount} ${payload.closingCurrency}.`,
      user: actor,
    })

    return cashSession
  }
}
