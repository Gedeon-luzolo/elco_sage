import type { ProductServiceDTO } from '~/types/dto'
import type { JSONDataTypes } from '~/types/json'
import type { CurrencyCode } from '~/utils/currency'
import { Currency } from '~/utils/currency'

export type SalePaymentType = 'CASH' | 'CREDIT' | 'OFFERED'

// Etat minimal d'une ligne dans le formulaire de vente.
export interface SaleLineState {
  productServiceId: string
  quantity: number
}

// Donnees necessaires pour valider le formulaire avant l'envoi.
interface SaleFormState {
  currentCashSessionId?: string | null
  paymentType: SalePaymentType
  orderNumber: string
  operatorId: string
  customerId: string
  discountAmount: number
  lines: SaleLineState[]
}

// Donnees utilisees pour construire le payload backend sans exposer les calculs dans la page.
interface BuildSalePayloadInput {
  paymentType: SalePaymentType
  orderNumber: string
  customerId: string
  operatorId: string
  currency: CurrencyCode
  payableAmount: number
  theoreticalAmount: number
  lines: SaleLineState[]
}

type SaleServiceOption = Record<string, JSONDataTypes> & ProductServiceDTO

// Options affichees dans le select du type de paiement.
export const SALE_PAYMENT_OPTIONS: Array<{ label: string; value: SalePaymentType }> = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Offert', value: 'OFFERED' },
]

export const EMPTY_SALE_LINE: SaleLineState = {
  productServiceId: '',
  quantity: 1,
}

// Retourne le prix du service selon la devise de vente selectionnee.
export function getSaleServiceUnitPrice(
  service: SaleServiceOption | undefined,
  currency: CurrencyCode
) {
  if (!service) {
    return 0
  }

  return currency === Currency.USD ? service.priceUsd : service.priceCdf
}

// Calcule le total d'une ligne de vente.
export function getSaleLineTotal(
  line: SaleLineState,
  servicesById: Map<string, SaleServiceOption>,
  currency: CurrencyCode
) {
  const service = servicesById.get(line.productServiceId)
  const unitPrice = getSaleServiceUnitPrice(service, currency)

  return unitPrice * Number(line.quantity || 0)
}

// Retourne le service selectionne sur une ligne de vente.
export function getSaleLineService(
  line: SaleLineState,
  servicesById: Map<string, SaleServiceOption>
) {
  return servicesById.get(line.productServiceId)
}

// Calcule le montant avant remise sur toutes les lignes.
export function getSaleTheoreticalAmount(
  lines: SaleLineState[],
  servicesById: Map<string, SaleServiceOption>,
  currency: CurrencyCode
) {
  return lines.reduce((sum, line) => sum + getSaleLineTotal(line, servicesById, currency), 0)
}

// Garde le montant a payer dans les bornes autorisees par le total theorique.
export function normalizeSalePayableAmount(payableAmount: number, theoreticalAmount: number) {
  return Math.min(Math.max(Number(payableAmount || 0), 0), theoreticalAmount)
}

// Calcule la remise a partir du montant que le client accepte de payer.
export function getSaleDiscountAmountFromPayableAmount(
  theoreticalAmount: number,
  payableAmount: number
) {
  return theoreticalAmount - normalizeSalePayableAmount(payableAmount, theoreticalAmount)
}

// Verifie les conditions minimales avant l'envoi du formulaire.
export function canSubmitSaleForm(form: SaleFormState) {
  const requiresCustomer = form.paymentType !== 'CASH' || Number(form.discountAmount || 0) > 0

  // La validation frontend reste volontairement minimale; le backend recalculera les prix.
  return (
    Boolean(form.currentCashSessionId) &&
    Boolean(form.operatorId) &&
    form.orderNumber.trim().length > 0 &&
    form.lines.some((line) => line.productServiceId && line.quantity > 0) &&
    (!requiresCustomer || Boolean(form.customerId))
  )
}

// Prepare uniquement les lignes valides attendues par le backend.
function buildSaleItemsPayload(lines: SaleLineState[]) {
  // Les lignes incompletes ne sont pas envoyees au serveur.
  const validLines = lines.filter((line) => line.productServiceId && line.quantity > 0)

  return validLines.map((line) => ({
    productServiceId: line.productServiceId,
    quantity: Number(line.quantity),
  }))
}

// Construit le payload attendu par POST /sales.
export function buildCreateSalePayload(input: BuildSalePayloadInput) {
  return {
    // Le bon est unique pour toute l'addition ; il est nettoye pour eviter les espaces parasites.
    orderNumber: input.orderNumber.trim(),
    customerId: input.customerId || null,
    operatorId: input.operatorId,
    paymentType: input.paymentType,
    currency: input.currency,
    // Le backend recevra uniquement la remise; il recalculera le total theorique depuis les services.
    discountAmount: getSaleDiscountAmountFromPayableAmount(
      input.theoreticalAmount,
      input.payableAmount
    ),
    items: buildSaleItemsPayload(input.lines),
  }
}
