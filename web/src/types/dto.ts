// Formes JSON renvoyées par l'API (miroir des transformers du backend).
// Le frontend ne dépend volontairement d'aucun fichier du dossier app/.
export type CustomerType = 'MALE' | 'FEMALE' | 'COMPANY'

// Client tel que renvoyé par l'API.
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

// Catégorie de produits et services.
export type ProductCategoryDTO = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Produit ou service du catalogue.
export type ProductServiceDTO = {
  id: string
  type: string
  name: string
  categoryId: string | null
  categoryName: string | null
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

// Utilisateur du système.
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

// Taux de change (createdAt n'est présent que dans l'historique).
export type ExchangeRateDTO = {
  id: string
  exchangeRate: number
  sellRate: number
  createdAt?: string
}
