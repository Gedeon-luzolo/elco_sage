import type { CustomerDTO } from '~/types/dto'

export type CustomerType = 'MALE' | 'FEMALE' | 'COMPANY'

export type CustomerItem = CustomerDTO

export interface CustomerStats {
  total: number
  activeCount: number
  inactiveCount: number
}

export type CustomersPageProps = {
  customers: CustomerItem[]
  stats: CustomerStats
}

export interface CustomerSelectOption<T extends string> {
  value: T
  label: string
}
