export type ProformaStatus = 'ISSUED' | 'CONVERTED' | 'CANCELLED'

export type ProformaItem = {
  id: string
  proformaId: string
  productServiceId: string
  position: number
  designation: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type ProformaRow = {
  id: string
  number: number
  customerId: string
  currency: string
  theoreticalAmount: number
  discountAmount: number
  totalAmount: number
  status: ProformaStatus
  issuedAt: string
  customer: { id: string; fullName: string } | null
  items: ProformaItem[]
}
