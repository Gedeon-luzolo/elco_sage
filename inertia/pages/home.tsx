import { Link } from '@adonisjs/inertia/react'
import { Home as HomeIcon } from 'lucide-react'
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
import { PageHeader } from '~/components/common/page_header'
import { type InertiaProps } from '~/types'

export default function Home(props: InertiaProps) {
  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <PageHeader
          title="Accueil"
          description={`Bienvenue ${props.user?.fullName}`}
          icon={HomeIcon}
        >
          <p className="text-sm text-muted-foreground">{props.user?.role}</p>
        </PageHeader>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
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
                  {module.href ? (
                    <Button
                      render={<Link href={module.href} />}
                      variant="outline"
                      className="w-full justify-center"
                    >
                      Ouvrir
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full justify-center" type="button">
                      Ouvrir
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </section>
      </section>
    </main>
  )
}
