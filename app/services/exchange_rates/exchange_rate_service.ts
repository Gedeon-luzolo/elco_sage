import { JournalisationModule } from '#models/journalisation'
import ExchangeRate, { type ExchangeRateType } from '#models/exchange_rate'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import type { CreateExchangeRateInput } from '#validators/exchange_rate'

const journalisationService = new JournalisationService()

export default class ExchangeRateService {
  // Recupere le dernier taux encode.
  async getCurrentRate() {
    return ExchangeRate.query().orderBy('createdAt', 'desc').first()
  }

  /**
   * Cree une nouvelle ligne de taux pour garder l'historique.
   * La derniere ligne creee devient automatiquement la valeur affichee dans l'app.
   */
  async create(actor: User, payload: CreateExchangeRateInput) {
    const previousRate = await this.getCurrentRate()

    const exchangeRate = await ExchangeRate.create({
      usdToCdfBuyRate: Number(payload.usdToCdfBuyRate),
      usdToCdfSellRate: Number(payload.usdToCdfSellRate),
    })

    await journalisationService.create({
      module: JournalisationModule.EXCHANGE_RATES,
      message: this.buildJournalMessage(actor, exchangeRate, previousRate),
      user: actor,
    })

    return exchangeRate
  }

  /**
   * Convertit un montant USD en CDF avec le dernier taux disponible.
   * Le type permet de choisir le taux d'achat ou de vente.
   */
  async convertUsdToCdf(amount: number, type: ExchangeRateType) {
    const rate = await this.getRequiredCurrentRate()

    return amount * this.getRateValue(rate, type)
  }

  /**
   * Convertit un montant CDF en USD avec le dernier taux disponible.
   * Le taux inverse est calcule pour eviter de stocker une valeur incoherente.
   */
  async convertCdfToUsd(amount: number, type: ExchangeRateType) {
    const rate = await this.getRequiredCurrentRate()

    return amount / this.getRateValue(rate, type)
  }

  // Renvoie le taux courant ou bloque la conversion.
  private async getRequiredCurrentRate() {
    const rate = await this.getCurrentRate()

    if (!rate) {
      throw new Error('Aucun taux de change disponible')
    }

    return rate
  }

  // Selectionne la valeur achat ou vente.
  private getRateValue(rate: ExchangeRate, type: ExchangeRateType) {
    if (type === 'buy') {
      return Number(rate.usdToCdfBuyRate)
    }

    return Number(rate.usdToCdfSellRate)
  }

  // Prepare un message lisible pour le journal.
  private buildJournalMessage(actor: User, rate: ExchangeRate, previousRate: ExchangeRate | null) {
    const actorName = actor.fullName ?? actor.email

    if (!previousRate) {
      return `Le taux USD/CDF a ete cree par ${actorName}. Achat: ${rate.usdToCdfBuyRate}, Vente: ${rate.usdToCdfSellRate}`
    }

    return `Le taux USD/CDF a ete mis a jour par ${actorName}. Achat: ${previousRate.usdToCdfBuyRate} -> ${rate.usdToCdfBuyRate}, Vente: ${previousRate.usdToCdfSellRate} -> ${rate.usdToCdfSellRate}`
  }
}
