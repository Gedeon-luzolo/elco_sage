import type { ProductServiceDTO } from '#transformers/product_service_transformer'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'
import type { SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { Currency } from '~/utils/currency'

export type SalePaymentType = 'CASH' | 'CREDIT' | 'OFFERED'

// Etat minimal d'une ligne dans le formulaire de vente.
export interface SaleLineState {
  orderNumber: string
  productServiceId: string
  quantity: number
}

// Donnees necessaires pour valider le formulaire avant l'envoi.
export interface SaleFormState {
  currentCashSessionId?: string | null
  paymentType: SalePaymentType
  operatorId: string
  customerId: string
  discountAmount: number
  lines: SaleLineState[]
}

// Donnees utilisees pour construire le payload backend sans exposer les calculs dans la page.
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

// Options affichees dans le select du type de paiement.
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

// Champs utilises par la recherche locale de la page des ventes.
export const saleSearchFields = [
  (sale: SaleItemRow) => sale.additionNumber,
  (sale: SaleItemRow) => sale.customer?.fullName,
  (sale: SaleItemRow) => sale.items.map((item) => item.orderNumber).join(' '),
]

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

// Verifie si la ligne respecte le stock disponible du produit consomme.
export function hasSaleLineStockIssue(
  line: SaleLineState,
  servicesById: Map<string, SaleServiceOption>
) {
  const service = getSaleLineService(line, servicesById)

  if (!service) {
    return false
  }

  // canSell couvre les blocages metier serveur: stock de la veille non valide, service mal configure, stock epuise.
  // saleAvailableStock couvre ensuite le cas ou la quantite saisie depasse le stock courant.
  return (
    !service.canSell ||
    service.saleAvailableStock === null ||
    Number(line.quantity || 0) > service.saleAvailableStock
  )
}

// Construit le message de stock affiche sous le service choisi.
export function getSaleLineStockMessage(
  line: SaleLineState,
  servicesById: Map<string, SaleServiceOption>
) {
  const service = getSaleLineService(line, servicesById)

  if (!service) {
    return null
  }

  // Le backend fournit deja une raison lisible quand le service n'est pas vendable.
  if (service.stockBlockingReason) {
    return service.stockBlockingReason
  }

  // Sans quantite ou unite, on prefere afficher un blocage clair plutot qu'un stock ambigu.
  if (service.saleAvailableStock === null || !service.stockProductBaseUnit) {
    return 'Stock indisponible pour ce service.'
  }

  // Une unite de service consomme une unite de base du produit lie.
  return `Stock disponible: ${service.saleAvailableStock} ${service.stockProductBaseUnit}`
}

// Calcule le montant avant remise sur toutes les lignes.
export function getSaleTheoreticalAmount(
  lines: SaleLineState[],
  servicesById: Map<string, SaleServiceOption>,
  currency: CurrencyCode
) {
  return lines.reduce((sum, line) => sum + getSaleLineTotal(line, servicesById, currency), 0)
}

// Verifie si au moins une ligne selectionnee depasse ou bloque le stock disponible.
export function hasSaleStockIssue(
  lines: SaleLineState[],
  servicesById: Map<string, SaleServiceOption>
) {
  // Un seul probleme de stock suffit a bloquer le bouton d'enregistrement.
  return lines.some((line) => hasSaleLineStockIssue(line, servicesById))
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

  // La validation frontend reste volontairement minimale; le backend recalculera prix et stock.
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
  // Les lignes incompletes ne sont pas envoyees au serveur.
  const validLines = lines.filter(
    (line) => line.orderNumber.trim().length > 0 && line.productServiceId && line.quantity > 0
  )

  return validLines.map((line) => ({
    // Le numero de bon est nettoye avant envoi pour eviter les espaces parasites.
    orderNumber: line.orderNumber.trim(),
    productServiceId: line.productServiceId,
    quantity: Number(line.quantity),
  }))
}

// Construit le payload attendu par POST /sales.
export function buildCreateSalePayload(input: BuildSalePayloadInput) {
  return {
    // Une vente cash sans client garde une valeur null cote backend.
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
