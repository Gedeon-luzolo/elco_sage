import { motion } from 'framer-motion'
import { Skeleton } from '~/components/ui/skeleton'

// Squelette affiché pendant le chargement d'un module en lazy, à la place d'un écran blanc.
// Il reprend la mise en page commune : en-tête, barre d'actions, cartes puis tableau.
export function PageSkeleton() {
  return (
    <main className="min-h-screen bg-muted/40 text-foreground" role="status" aria-label="Chargement de la page">
      <motion.section
        className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 lg:px-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // Le léger délai évite un flash quand le module est déjà en cache
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {/* En-tête : icône, titre, description et bouton d'action */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-8 w-56" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-2xl border bg-card p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </div>

        {/* Tableau : une ligne d'en-tête puis quelques lignes */}
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </motion.section>
    </main>
  )
}
