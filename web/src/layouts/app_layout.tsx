import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { AppBar } from '~/components/app/app_bar'
import { IdleScreen } from '~/components/auth/idle_screen'
import { TooltipProvider } from '~/components/ui/tooltip'
import { useAuth } from '~/hooks/auth/useAuth'

// Garde le module management sans barre globale (il a sa propre sidebar).
function isAppBarExcluded(pathname: string) {
  return pathname.startsWith('/management')
}

export function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  // Les toasts d'une page ne doivent pas suivre l'utilisateur sur la suivante.
  useEffect(() => {
    toast.dismiss()
  }, [pathname])

  return (
    <TooltipProvider>
      {user && !isAppBarExcluded(pathname) && <AppBar />}
      <Outlet />
      <IdleScreen user={user ?? undefined} />
    </TooltipProvider>
  )
}
