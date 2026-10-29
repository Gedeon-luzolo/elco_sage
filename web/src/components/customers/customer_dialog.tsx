import { Button } from '~/components/ui/button'
import { SubmitButton } from '~/components/common/submit_button'
import { useCrud } from '~/hooks/common/useCrud'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { OptionSelect } from '~/components/common/option_select'
import { CUSTOMER_TYPE_OPTIONS } from '~/constants/customers'
import type { CustomerItem } from '~/types/customer_types'
import { ACTIVE_STATUS_OPTIONS } from '~/utils/status.utils'
import { fieldFormData } from '~/utils/form.utils'

interface CustomerDialogProps {
  title: string
  description: string
  open: boolean
  customer: CustomerItem | null
  submitLabel: string
  onOpenChange: (open: boolean) => void
  onCreated?: (customer: CustomerItem) => void
}

export function CustomerDialog({
  title,
  description,
  open,
  customer,
  submitLabel,
  onOpenChange,
  onCreated,
}: CustomerDialogProps) {
  // Les clients actifs alimentent aussi la vente : on invalide les deux listes.
  const { useCreate, usePatch } = useCrud<CustomerItem>({
    endpoint: '/customers',
    invalidateQueries: ['/customers'],
  })
  const createCustomer = useCreate<Record<string, unknown>, CustomerItem>()
  const updateCustomer = usePatch<Record<string, unknown>>()

  // Indique si on est en mode edition ou creation.
  const isEditing = customer !== null

  const handleSubmit = (formData: FormData) => {
    const options = { onSuccess: () => onOpenChange(false) }
    // Construction du payload commun aux deux cas (creation et edition).
    const payload = {
      fullName: fieldFormData('fullName', formData) ?? '',
      customerType: fieldFormData('customerType', formData) ?? '',
      phoneNumber: fieldFormData('phoneNumber', formData) ?? null,
      email: fieldFormData('email', formData) ?? null,
    }

    if (customer) {
      // En edition, on ajoute le statut au payload commun.
      updateCustomer.mutate(
        {
          id: customer.id,
          data: { ...payload, isActive: formData.get('isActive') === 'true' },
        },
        options
      )
    } else {
      // En creation, isActive est absent et le backend le fixe a true.
      createCustomer.mutate(payload, {
        onSuccess: (createdCustomer) => {
          onOpenChange(false)
          onCreated?.(createdCustomer)
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          key={`${title}-${customer?.id ?? 'new'}`}
          className="grid gap-5"
          action={handleSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor="customer-full-name">Nom complet *</Label>
            <Input
              id="customer-full-name"
              name="fullName"
              className="h-10 px-3"
              defaultValue={customer?.fullName ?? ''}
              placeholder="ex: Jean Mukendi"
              required
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="customer-type">Type de client *</Label>
              <OptionSelect
                id="customer-type"
                name="customerType"
                options={CUSTOMER_TYPE_OPTIONS}
                defaultValue={customer?.customerType ?? 'MALE'}
                required
              />
            </div>

            <div className="grid flex-1 gap-2">
              <Label htmlFor="customer-phone-number">Numéro de téléphone</Label>
              <Input
                id="customer-phone-number"
                name="phoneNumber"
                className="h-10 px-3"
                defaultValue={customer?.phoneNumber ?? ''}
                placeholder="ex: +243 000 000 000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              name="email"
              type="email"
              className="h-10 px-3"
              defaultValue={customer?.email ?? ''}
              placeholder="email@exemple.com"
            />
          </div>

          {/* Le statut est visible uniquement en edition. */}
          {isEditing && (
            <div className="grid gap-2">
              <Label htmlFor="customer-status">Statut</Label>
              <OptionSelect
                id="customer-status"
                name="isActive"
                options={ACTIVE_STATUS_OPTIONS}
                defaultValue={customer ? String(customer.isActive) : 'true'}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" size="lg" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <SubmitButton size="lg" label={submitLabel} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
