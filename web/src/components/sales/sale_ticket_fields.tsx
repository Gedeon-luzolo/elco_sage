import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CustomerDialog } from '~/components/customers/customer_dialog'
import { OptionSelect } from '~/components/common/option_select'
import { SearchableSelect } from '~/components/common/searchable_select'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'
import type { CustomerDTO } from '~/types/dto'
import type { CustomerItem } from '~/types/customer_types'
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
  operatorMissing?: boolean
  customerMissing?: boolean
  onCustomerCreated: (customer: CustomerItem) => void
}

// Contour rouge d'un champ obligatoire resté vide.
const MISSING_FIELD_CLASS = 'border-destructive ring-3 ring-destructive/20'

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
  operatorMissing = false,
  customerMissing = false,
  onCustomerCreated,
}: SaleTicketFieldsProps) {
  // État du dialogue de création rapide du client.
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  return (
    <div className="space-y-3 p-4">
      {/* Opérateur d'abord, avec la devise : il est toujours requis */}
      <div className="flex gap-3">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor="sale-operator" className={cn(operatorMissing && 'text-destructive')}>
            Opérateur{operatorMissing && ' · requis'}
          </Label>
          <OptionSelect
            id="sale-operator"
            options={operators.map((operator) => ({
              label: operator.fullName ?? operator.email,
              value: operator.id,
            }))}
            value={operatorId}
            onValueChange={onOperatorChange}
            placeholder="Sélectionner..."
            className={cn('h-10 w-full', operatorMissing && MISSING_FIELD_CLASS)}
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
        {/* Requis pour un crédit, une vente offerte ou une remise : signalé en rouge s'il manque */}
        <Label htmlFor="sale-customer" className={cn(customerMissing && 'text-destructive')}>
          Client{customerMissing && ' · requis'}
        </Label>
        <div className="flex gap-2">
          <SearchableSelect
            id="sale-customer"
            items={customers}
            value={customerId}
            onValueChange={onCustomerChange}
            getValue={(customer) => customer.id}
            getLabel={(customer) => customer.fullName}
            placeholder={customerMissing ? 'Choisir un client' : 'Passager'}
            emptyMessage="Aucun client trouvé."
            className={cn('h-10 min-w-0 flex-1', customerMissing && MISSING_FIELD_CLASS)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Créer un client"
            title="Créer un client"
            onClick={() => setCustomerDialogOpen(true)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={null}
        title="Nouveau client"
        description="Créez une fiche client sans quitter la vente."
        submitLabel="Créer le client"
        onCreated={onCustomerCreated}
      />
    </div>
  )
}
