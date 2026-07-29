import { Form } from '@adonisjs/inertia/react'
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
          <button
            type="submit"
            disabled={processing}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Se deconnecter
          </button>
        )}
      </Form>
    </main>
  )
}
