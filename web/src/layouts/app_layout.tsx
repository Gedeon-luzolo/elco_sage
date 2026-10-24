import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { AppBar } from '~/components/app/app_bar'
import { OfflineNotice } from '~/components/app/offline_notice'
import { IdleScreen } from '~/components/auth/idle_screen'
import { TooltipProvider } from '~/components/ui/tooltip'
import { useAuth } from '~/hooks/auth/useAuth'
import { startAutoSync } from '~/lib/offline/sync'

// Le module management n'a pas de barre globale (il a sa propre sidebar).
function isAppBarExcluded(pathname: string) {
  return pathname.startsWith('/management')
}

// Gabarit des pages connectées : barre d'application, synchronisation hors ligne et verrouillage.
export function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  // Rejoue la file d'attente au démarrage, au retour du réseau et à intervalle régulier
  const userId = user?.id
  useEffect(() => (userId ? startAutoSync(userId) : undefined), [userId])

  // Les toasts d'une page ne doivent pas suivre l'utilisateur sur la suivante
  useEffect(() => {
    toast.dismiss()
  }, [pathname])

  return (
    <TooltipProvider>
      {user && !isAppBarExcluded(pathname) && <AppBar />}
      {user && <OfflineNotice />}
      <Outlet />
      <IdleScreen user={user ?? undefined} />
    </TooltipProvider>
  )
}
