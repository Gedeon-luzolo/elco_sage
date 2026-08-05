import { CheckCircle2, Edit2, XCircle } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { CUSTOMER_TYPE_LABELS } from '~/constants/customers'
import type { CustomerItem } from '~/types/customer_types'
import { formatShortDate } from '~/utils/date'

interface CustomerCardProps {
  customer: CustomerItem
  onEdit: (customer: CustomerItem) => void
}

export function CustomerCard({ customer, onEdit }: CustomerCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:border-primary/40">
      {/* En-tete de la fiche customer. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{customer.fullName}</h3>
        </div>

        {customer.isActive ? (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-3" />
            Actif
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-muted bg-muted/50 text-muted-foreground">
            <XCircle className="size-3" />
            Inactif
          </Badge>
        )}
      </div>

      {/* Details principaux du customer. */}
      <div className="grid gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium text-foreground">
            {CUSTOMER_TYPE_LABELS[customer.customerType]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Telephone</span>
          <span className="font-medium text-foreground">
            {customer.phoneNumber || 'Non renseigne'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Email</span>
          <span className="truncate font-medium text-foreground">
            {customer.email || 'Non renseigne'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Creation</span>
          <span className="text-xs font-medium text-foreground">
            {formatShortDate(customer.createdAt)}
          </span>
        </div>
      </div>

      {/* Action de modification. */}
      <div className="border-t border-border pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={() => onEdit(customer)}
          title="Modifier"
        >
          <Edit2 className="size-4" />
          Modifier
        </Button>
      </div>
    </div>
  )
}
