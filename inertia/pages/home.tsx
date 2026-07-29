import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/components/ui/button'
import { type InertiaProps } from '~/types'

export default function Home(props: InertiaProps) {
  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h2 className="text-3xl">
        Bienvenue, <span className="font-bold">{props.user?.fullName}</span>
      </h2>
      <p className="text-muted-foreground">{props.user?.role}</p>
      <Form route="session.destroy">
        {({ processing }) => (
          <Button
            variant="outline"
            type="submit"
            disabled={processing}
          >
            Se deconnecter
          </Button>
        )}
      </Form>
    </main>
  )
}
