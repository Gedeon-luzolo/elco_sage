import type { ProductServiceDTO } from '#transformers/product_service_transformer'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { CurrencyCode } from '~/utils/currency'
import { Currency } from '~/utils/currency'
import { formatDateTimeLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

export type SalePaymentType = 'CASH' | 'CREDIT' | 'OFFERED'

export interface SaleLineState {
  orderNumber: string
  productServiceId: string
  quantity: number
}

export interface SaleFormState {
  currentCashSessionId?: string | null
  paymentType: SalePaymentType
  operatorId: string
  customerId: string
  discountAmount: number
  lines: SaleLineState[]
}

export interface BuildSalePayloadInput {
  paymentType: SalePaymentType
  customerId: string
  operatorId: string
  currency: CurrencyCode
  payableAmount: number
  theoreticalAmount: number
  lines: SaleLineState[]
}

export type SaleServiceOption = Record<string, JSONDataTypes> & ProductServiceDTO

export const SALE_PAYMENT_OPTIONS: Array<{ label: string; value: SalePaymentType }> = [
  { label: 'Cash', value: 'CASH' },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Offert', value: 'OFFERED' },
]

export const EMPTY_SALE_LINE: SaleLineState = {
  orderNumber: '',
  productServiceId: '',
  quantity: 1,
}

// Formate un montant de vente dans sa devise.
export function formatSaleMoney(value: number, currency: string) {
  return formatMoneyWithCurrency(value, currency as CurrencyCode)
}

// Formate la date/heure de vente pour les tableaux et details.
export function formatSaleDate(value: string | null) {
  return formatDateTimeLabel(value)
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

  return (
    Boolean(form.currentCashSessionId) &&
    Boolean(form.operatorId) &&
    form.lines.some(
      (line) => line.orderNumber.trim().length > 0 && line.productServiceId && line.quantity > 0
    ) &&
    (!requiresCustomer || Boolean(form.customerId))
  )
}

// Prepare uniquement les lignes valides attendues par le backend.
export function buildSaleItemsPayload(lines: SaleLineState[]) {
  return lines
    .filter(
      (line) => line.orderNumber.trim().length > 0 && line.productServiceId && line.quantity > 0
    )
    .map((line) => ({
      orderNumber: line.orderNumber.trim(),
      productServiceId: line.productServiceId,
      quantity: Number(line.quantity),
    }))
}

// Construit le payload attendu par POST /sales.
export function buildCreateSalePayload(input: BuildSalePayloadInput) {
  return {
    customerId: input.customerId || null,
    operatorId: input.operatorId,
    paymentType: input.paymentType,
    currency: input.currency,
    discountAmount: getSaleDiscountAmountFromPayableAmount(
      input.theoreticalAmount,
      input.payableAmount
    ),
    items: buildSaleItemsPayload(input.lines),
  }
}
