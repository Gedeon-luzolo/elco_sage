import { Home as HomeIcon } from 'lucide-react'
import { PageHeader } from '~/components/common/page_header'
import { ModuleListRow } from '~/components/navigation/module_list_row'
import { MODULES } from '~/constants/modules'
import { useAuth } from '~/hooks/auth/useAuth'

export default function Home() {
  const { user } = useAuth()

  // Répartit les modules sur les deux colonnes de l'aperçu liste.
  const half = Math.ceil(MODULES.length / 2)
  const leftModules = MODULES.slice(0, half)
  const rightModules = MODULES.slice(half)

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <PageHeader
          title="Elco Sage"
          description="Choisissez une application pour commencer."
          icon={HomeIcon}
        >
          <span className="text-sm text-muted-foreground">{user?.role}</span>
        </PageHeader>

        {/* grid-cols-1 borne la colonne à la largeur de l'écran : les textes tronqués ne débordent plus */}
        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 sm:divide-x sm:divide-border">
          <div className="min-w-0 sm:pr-6">
            {leftModules.map((module) => (
              <ModuleListRow
                key={module.title}
                title={module.title}
                description={module.description}
                href={module.href}
                icon={module.icon}
                color={module.color}
                isManagement={module.isManagement}
              />
            ))}
          </div>

          <div className="min-w-0 sm:pl-6">
            {rightModules.map((module) => (
              <ModuleListRow
                key={module.title}
                title={module.title}
                description={module.description}
                href={module.href}
                icon={module.icon}
                color={module.color}
                isManagement={module.isManagement}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
