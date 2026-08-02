import type { LucideIcon } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  className?: string
  labelClassName?: string
  valueClassName?: string
  icon?: LucideIcon
  size?: 'default' | 'sm'
}

/**
 * Composant de carte statistique réutilisable à travers toute l'application.
 */
export function StatCard({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
  icon: Icon,
  size = 'sm',
}: StatCardProps) {
  return (
    <Card size={size} className={cn('bg-background', className)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardDescription className={labelClassName}>{label}</CardDescription>
          {Icon && <Icon className="size-4 text-muted-foreground shrink-0" />}
        </div>
        <CardTitle className={cn('text-3xl font-bold', valueClassName)}>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
