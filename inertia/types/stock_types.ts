import { dateKey } from '~/utils/date'

export type StockUnit = 'base' | 'packaging'

export interface StockMovementItem {
  id: string | number // UUID réel ou -1 pour produits sans mouvement
  productId: string
  productName: string
  productBaseUnit: string
  productPackagingUnit: string | null
  productPackagingCapacity: number | null
  categoryName: string | null
  date: string
  initialStock: number | null
  entries: number | null
  availableStock: number | null
  outputs: number | null
  losses: number | null
  theoreticalStock: number | null
  physicalStock: number | null
  variance: number | null
  isPhysicalStockValidated: boolean
}

export interface InventoryPageProps {
  stockItems: StockMovementItem[]
  currentDate: string
}

export interface StockFormState {
  productId: string
  date: string
  entries: number
  unit: StockUnit
}

export interface PhysicalStockFormState {
  productId: string
  date: string
  physicalStock: number
  physicalStockUnit: StockUnit
  losses?: number
  lossesUnit?: StockUnit
}

export const EMPTY_STOCK_FORM: StockFormState = {
  productId: '',
  date: dateKey,
  entries: 0,
  unit: 'base',
}

export const EMPTY_PHYSICAL_STOCK_FORM: PhysicalStockFormState = {
  productId: '',
  date: dateKey,
  physicalStock: 0,
  physicalStockUnit: 'base',
  losses: 0,
  lossesUnit: 'base',
}
