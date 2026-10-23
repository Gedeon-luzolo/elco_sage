/**
 * Formes JSON renvoyees par l'API (miroir des transformers du backend).
 * Le frontend ne depend volontairement d'aucun fichier du dossier app/.
 */
export type CustomerType = 'MALE' | 'FEMALE' | 'COMPANY'

export type CustomerDTO = {
  id: string
  fullName: string
  customerType: CustomerType
  phoneNumber: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type ProductCategoryDTO = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type ProductServiceDTO = {
  id: string
  type: string
  name: string
  categoryId: string | null
  categoryName: string | null
  stockProductId: string | null
  stockProductName: string | null
  stockProductBaseUnit: string | null
  saleAvailableStock: number | null
  canSell: boolean
  stockBlockingReason: string | null
  isActive: boolean
  baseUnit: string | null
  packagingUnit: string | null
  packagingCapacity: number | null
  priceUsd: number
  priceCdf: number
  materialCostUsd: number
  materialCostCdf: number
  createdAt: string
  updatedAt: string | null
}

export type UserDTO = {
  id: string
  fullName: string | null
  email: string
  role: 'ADMIN' | 'DIRECTOR' | 'CASHIER' | 'OPERATOR'
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  createdAt: string
  updatedAt: string | null
  initials: string
}

export type ExchangeRateDTO = {
  id: string
  exchangeRate: number
  sellRate: number
  createdAt?: string
}
