import { OptionSelect } from '~/components/common/option_select'
import { SearchableSelect } from '~/components/common/searchable_select'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { CustomerDTO } from '~/types/dto'
import type { UserSummaryDTO } from '~/types/dto'
import { CURRENCY_OPTIONS, type CurrencyCode } from '~/utils/currency'
import {
  PAYMENT_METHOD_OPTIONS,
  paymentMethodNeedsReference,
  type PaymentMethod,
} from '~/utils/sales/payment.utils'
import { SALE_PAYMENT_OPTIONS, type SalePaymentType } from '~/utils/sales/sale.utils'

interface SaleTicketFieldsProps {
  paymentType: SalePaymentType
  onPaymentTypeChange: (value: SalePaymentType) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (value: PaymentMethod) => void
  paymentReference: string
  onPaymentReferenceChange: (value: string) => void
  currency: CurrencyCode
  onCurrencyChange: (value: CurrencyCode) => void
  operatorId: string
  onOperatorChange: (value: string) => void
  customerId: string
  onCustomerChange: (value: string) => void
  operators: UserSummaryDTO[]
  customers: CustomerDTO[]
}

// Informations générales de la vente : client, opérateur, devise, type et mode de paiement.
export function SaleTicketFields({
  paymentType,
  onPaymentTypeChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentReference,
  onPaymentReferenceChange,
  currency,
  onCurrencyChange,
  operatorId,
  onOperatorChange,
  customerId,
  onCustomerChange,
  operators,
  customers,
}: SaleTicketFieldsProps) {
  return (
    <div className="space-y-3 border-t border-border p-4">
      {/* Opérateur d'abord, avec la devise : il est toujours requis */}
      <div className="flex gap-3">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor="sale-operator">Opérateur</Label>
          <OptionSelect
            id="sale-operator"
            options={operators.map((operator) => ({
              label: operator.fullName ?? operator.email,
              value: operator.id,
            }))}
            value={operatorId}
            onValueChange={onOperatorChange}
            placeholder="Sélectionner..."
          />
        </div>

        <div className="grid w-26 shrink-0 gap-1.5">
          <Label htmlFor="sale-currency">Devise</Label>
          <OptionSelect
            id="sale-currency"
            options={CURRENCY_OPTIONS}
            value={currency}
            onValueChange={(value) => onCurrencyChange(value as CurrencyCode)}
          />
        </div>
      </div>

      {/* Type et mode côte à côte : le mode ne concerne qu'une vente payée tout de suite */}
      <div className="flex gap-3">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor="sale-payment-type">Type de paiement</Label>
          <OptionSelect
            id="sale-payment-type"
            options={SALE_PAYMENT_OPTIONS}
            value={paymentType}
            onValueChange={onPaymentTypeChange}
          />
        </div>

        {paymentType === 'CASH' && (
          <div className="grid min-w-0 flex-1 gap-1.5">
            <Label htmlFor="sale-payment-method">Mode de paiement</Label>
            <OptionSelect
              id="sale-payment-method"
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethod}
              onValueChange={onPaymentMethodChange}
            />
          </div>
        )}
      </div>

      {/* Pas de référence pour les espèces : rien à tracer */}
      {paymentType === 'CASH' && paymentMethodNeedsReference(paymentMethod) && (
        <div className="grid gap-1.5">
          <Label htmlFor="sale-payment-reference">Référence</Label>
          <Input
            id="sale-payment-reference"
            value={paymentReference}
            onChange={(event) => onPaymentReferenceChange(event.target.value)}
            placeholder="N° de transaction (facultatif)"
            maxLength={100}
            className="h-10"
          />
        </div>
      )}

      {/* Le client vient en dernier, sur sa propre ligne : il n'est pas toujours requis */}
      <div className="grid gap-1.5">
        <Label htmlFor="sale-customer">Client</Label>
        <SearchableSelect
          id="sale-customer"
          items={customers}
          value={customerId}
          onValueChange={onCustomerChange}
          getValue={(customer) => customer.id}
          getLabel={(customer) => customer.fullName}
          placeholder="Passager"
          emptyMessage="Aucun client trouvé."
        />
      </div>
    </div>
  )
}
