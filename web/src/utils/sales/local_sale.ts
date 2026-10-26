import type { CustomerDTO, ProductServiceDTO, UserDTO } from '~/types/dto'
import type { SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { getSaleServiceUnitPrice } from '~/utils/sales/sale.utils'

// Corps d'une vente tel que construit par le formulaire.
interface SalePayload {
  paymentType: string
  paymentMethod: string | null
  paymentReference: string | null
  customerId: string | null
  operatorId: string
  currency: string
  discountAmount: number
  items: Array<{ productServiceId: string; quantity: number }>
}

// Données nécessaires pour reconstruire la vente : le corps, les listes de référence et le vendeur.
interface BuildLocalSaleInput {
  id: string
  additionNumber: string
  saleDate: string
  cashSessionId: string
  payload: SalePayload
  services: ProductServiceDTO[]
  customers: CustomerDTO[]
  operators: Array<Pick<UserDTO, 'id' | 'fullName'>>
  seller: UserDTO
}

// Construit la vente telle que le serveur la renverrait, pour imprimer le ticket
// et l'afficher tant que la vente n'est pas synchronisée.
export function buildLocalSale(input: BuildLocalSaleInput): SaleItemRow {
  const { payload } = input
  const currency = payload.currency as CurrencyCode
  const servicesById = new Map(input.services.map((service) => [service.id, service]))

  // Chaque ligne reprend le prix du service dans la devise de la vente
  const items = payload.items.map((item, index) => {
    const service = servicesById.get(item.productServiceId)
    const unitPrice = getSaleServiceUnitPrice(service, currency)

    return {
      id: `${input.id}-${index}`,
      saleId: input.id,
      productServiceId: item.productServiceId,
      quantity: Number(item.quantity),
      currency: payload.currency,
      unitPrice,
      totalPrice: unitPrice * Number(item.quantity),
      productService: service ?? null,
    }
  })

  // Le total théorique est la somme des lignes, la remise vient du corps de la vente
  const theoreticalAmount = items.reduce((total, item) => total + item.totalPrice, 0)
  const discountAmount = Number(payload.discountAmount ?? 0)

  // Mêmes champs que la réponse du serveur, pour que le ticket s'affiche à l'identique
  return {
    id: input.id,
    cashSessionId: input.cashSessionId,
    customerId: payload.customerId,
    operatorId: payload.operatorId,
    sellerId: input.seller.id,
    paymentType: payload.paymentType,
    paymentMethod: payload.paymentMethod,
    paymentReference: payload.paymentReference,
    additionNumber: input.additionNumber,
    saleDate: input.saleDate,
    currency: payload.currency,
    theoreticalAmount,
    discountAmount,
    totalAmount: theoreticalAmount - discountAmount,
    status: 'ACTIVE',
    cashSessionStatus: 'OPEN',
    customer: input.customers.find((customer) => customer.id === payload.customerId) ?? null,
    operatorName:
      input.operators.find((operator) => operator.id === payload.operatorId)?.fullName ?? null,
    sellerName: input.seller.fullName,
    items,
    recoveries: [],
  }
}
