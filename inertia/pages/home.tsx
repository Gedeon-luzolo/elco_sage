import { Form } from '@adonisjs/inertia/react'
import { BarChart3 } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { MODULES } from '~/constants/modules'
import { type InertiaProps } from '~/types'

export default function Home(props: InertiaProps) {
  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 bg-background">
              Elco Sage
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">Acceuil</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Bienvenue {props.user?.fullName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">{props.user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{props.user?.role}</p>
            </div>
            <Form route="session.destroy">
              {({ processing }) => (
                <Button variant="outline" type="submit" disabled={processing}>
                  Se deconnecter
                </Button>
              )}
            </Form>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => {
            const Icon = module.icon

            return (
              <Card
                key={module.title}
                className="rounded-2xl bg-background transition-colors hover:bg-card/80"
              >
                <CardHeader>
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#2b1810] text-amber-50">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                  <CardAction>
                    {module.isManagement && <Badge variant="secondary">Direction</Badge>}
                  </CardAction>
                </CardHeader>
                <CardContent>
                  {/* Les vraies routes de modules seront branchees apres creation des ecrans. */}
                  <Button variant="outline" className="w-full justify-center" type="button">
                    Ouvrir
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card size="sm" className="rounded-2xl bg-background md:col-span-2">
            <CardHeader>
              <CardTitle>Vue generale</CardTitle>
              <CardDescription>
                Les indicateurs rapides seront affiches ici apres connexion des modules metier.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm" className="rounded-2xl bg-[#2b1810] text-amber-50">
            <CardHeader>
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-50/10">
                <BarChart3 className="size-5" aria-hidden="true" />
              </div>
              <CardTitle>Acces rapide</CardTitle>
              <CardDescription className="text-amber-50/70">
                Une navigation simple pour demarrer la gestion quotidienne.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </section>
    </main>
  )
}
