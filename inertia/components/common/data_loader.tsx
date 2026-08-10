import { motion } from 'framer-motion'
import { cn } from '~/lib/utils'

interface DataLoaderProps {
  title?: string
  className?: string
}

// Loader de données réutilisable pour occuper la zone de contenu pendant un rechargement.
export function DataLoader({ title = 'Chargement des données...', className }: DataLoaderProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-200 w-full flex-col items-center justify-center rounded-lg border bg-muted/40 px-6 py-10',
        className
      )}
    >
      <div className="flex h-24 items-center justify-center">
        <div className="flex items-end gap-3">
          {[0, 1, 2, 3, 4].map((index) => (
            <motion.span
              key={index}
              className="block w-4 rounded-full bg-blue-500 shadow-sm"
              style={{
                height: `${80 + index * 10}px`,
              }}
              animate={{
                scaleY: [0.72, 1.08, 0.72],
                opacity: [0.55, 1, 0.55],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.09,
              }}
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm font-medium text-muted-foreground">{title}</p>
    </section>
  )
}
