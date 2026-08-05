import type Customer from '#models/customer'
import type { CustomerType } from '#models/customer'

export interface CustomerDTO {
  id: string
  fullName: string
  customerType: CustomerType
  phoneNumber: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export default class CustomerTransformer {
  public static transformSingle(customer: Customer): CustomerDTO {
    return {
      id: customer.id,
      fullName: customer.fullName,
      customerType: customer.customerType,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISO() ?? customer.createdAt.toString(),
      updatedAt: customer.updatedAt
        ? (customer.updatedAt.toISO() ?? customer.updatedAt.toString())
        : null,
    }
  }

  public static transform(customers: Customer[]): CustomerDTO[] {
    return customers.map((customer) => this.transformSingle(customer))
  }
}
