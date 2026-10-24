import { OptionSelect } from '~/components/common/option_select'
import { SearchableSelect } from '~/components/common/searchable_select'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'
import type { CustomerDTO } from '~/types/dto'
import type { UserListItem } from '~/types/user_types'
import { CURRENCY_OPTIONS, type CurrencyCode } from '~/utils/currency'
import { SALE_PAYMENT_OPTIONS, type SalePaymentType } from '~/utils/sales/sale.utils'

interface SaleTicketFieldsProps {
  orderNumber: string
  onOrderNumberChange: (value: string) => void
  paymentType: SalePaymentType
  onPaymentTypeChange: (value: SalePaymentType) => void
  currency: CurrencyCode
  onCurrencyChange: (value: CurrencyCode) => void
  operatorId: string
  onOperatorChange: (value: string) => void
  customerId: string
  onCustomerChange: (value: string) => void
  operators: UserListItem[]
  customers: CustomerDTO[]
}

// Informations générales de la vente : client, opérateur, devise et type de paiement.
export function SaleTicketFields({
  orderNumber,
  onOrderNumberChange,
  paymentType,
  onPaymentTypeChange,
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
    <div className="space-y-3 border-b border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="sale-order-number">N° de bon</Label>
          <Input
            id="sale-order-number"
            value={orderNumber}
            onChange={(event) => onOrderNumberChange(event.target.value)}
            placeholder="ex: BC-001"
            className="h-10"
          />
        </div>

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

      <div className="grid grid-cols-[1fr_6.5rem] gap-3">
        <div className="grid gap-1.5">
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

        <div className="grid gap-1.5">
          <Label htmlFor="sale-currency">Devise</Label>
          <OptionSelect
            id="sale-currency"
            options={CURRENCY_OPTIONS}
            value={currency}
            onValueChange={(value) => onCurrencyChange(value as CurrencyCode)}
          />
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Paiement">
        {SALE_PAYMENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === paymentType}
            onClick={() => onPaymentTypeChange(option.value)}
            className={cn(
              'h-9 flex-1 rounded-lg text-sm transition-colors',
              option.value === paymentType
                ? 'bg-background font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
