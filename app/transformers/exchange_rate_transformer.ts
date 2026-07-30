import type ExchangeRate from '#models/exchange_rate'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class ExchangeRateTransformer extends BaseTransformer<ExchangeRate> {
  toObject() {
    return {
      id: this.resource.id,
      usdToCdfBuyRate: Number(this.resource.usdToCdfBuyRate),
      usdToCdfSellRate: Number(this.resource.usdToCdfSellRate),
    }
  }
}
