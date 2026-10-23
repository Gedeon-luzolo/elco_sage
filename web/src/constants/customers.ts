import type { CustomerSelectOption, CustomerType } from '~/types/customer_types'

// Options disponibles pour le champ type de customer.
export const CUSTOMER_TYPE_OPTIONS: Array<CustomerSelectOption<CustomerType>> = [
  { value: 'MALE', label: 'Homme' },
  { value: 'FEMALE', label: 'Femme' },
  { value: 'COMPANY', label: 'Entreprise' },
]

// Libelles des types de customers.
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  MALE: 'Homme',
  FEMALE: 'Femme',
  COMPANY: 'Entreprise',
}
