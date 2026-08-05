import type { CustomerDTO } from '#transformers/customer_transformer'

export type CustomerType = 'MALE' | 'FEMALE' | 'COMPANY'

export type CustomerItem = CustomerDTO

export interface CustomerStats {
  total: number
  activeCount: number
  inactiveCount: number
}

export interface CustomersPageProps {
  customers: CustomerItem[]
  stats: CustomerStats
}

export interface CustomerSelectOption<T extends string> {
  value: T
  label: string
}
