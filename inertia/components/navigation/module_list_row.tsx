import { Link } from '@adonisjs/inertia/react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'
import type { NavigationModule } from '~/constants/modules'

interface ModuleListRowProps {
  title: string
  description: string
  href?: string
  icon: LucideIcon
  color: NavigationModule['color']
  isManagement?: boolean
  className?: string
}

export function ModuleListRow({
  title,
  description,
  href,
  icon: Icon,
  color,
  isManagement,
  className,
}: ModuleListRowProps) {
  const rowClassName = cn(
    'flex items-center gap-4 border-b border-border py-4 transition last:border-b-0',
    href && 'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
    className
  )

  const content = (
    <>
      <div
        className={cn('grid size-10 shrink-0 place-items-center rounded-xl shadow-lg', color.icon)}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
      </div>

      {isManagement ? (
        <Badge variant="outline" className={cn('shrink-0', color.badge)}>
          Direction
        </Badge>
      ) : null}
    </>
  )

  if (!href) {
    return <div className={rowClassName}>{content}</div>
  }

  return (
    <Link href={href} title={description} className={rowClassName}>
      {content}
    </Link>
  )
}
