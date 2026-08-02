import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '~/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
  iconClassName?: string
  iconWrapperClassName?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  iconWrapperClassName,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'p-12 border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-center space-y-4',
        className
      )}
    >
      <div
        className={cn(
          'p-4 bg-purple-50 dark:bg-purple-950/20 rounded-full text-purple-500',
          iconWrapperClassName
        )}
      >
        <Icon className={cn('w-10 h-10 animate-pulse', iconClassName)} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">{description}</p>
        )}
      </div>
    </motion.div>
  )
}
