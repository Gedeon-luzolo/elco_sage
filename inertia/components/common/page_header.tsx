import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  accentClassName?: string
  children?: ReactNode
}

/**
 * En-tête commun à toutes les pages de gestion.
 * Affiche le titre, une description optionnelle, une icône Lucide stylisée
 * et un slot `children` pour les actions à droite.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  accentClassName = 'from-primary to-primary/80',
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        {/* Icône + titre sur la même ligne si une icône est fournie. */}
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-lg',
                accentClassName
              )}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">{title}</h1>
        </div>

        {/* Description sous le titre. */}
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>

      {/* Slot droit : bouton Créer, filtres, etc. */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  )
}
