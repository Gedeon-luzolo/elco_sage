import type { ProductServiceItem } from '~/types/product_service_types'
import { Currency } from '~/utils/currency'

/**
 * Retourne le prix éditable selon le type et la devise.
 */
export function getItemPriceForCurrency(item: ProductServiceItem, currency: Currency) {
  return currency === Currency.USD ? item.priceUsd : item.priceCdf
}
