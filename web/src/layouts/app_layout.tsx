import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { AppBar } from '~/components/app/app_bar'
import { IdleScreen } from '~/components/auth/idle_screen'
import { TooltipProvider } from '~/components/ui/tooltip'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import { refreshNumbering } from '~/lib/offline/numbering'
import { startAutoSync } from '~/lib/offline/sync'

// Le module management n'a pas de barre globale (il a sa propre sidebar).
function isAppBarExcluded(pathname: string) {
  return pathname.startsWith('/management')
}

// Gabarit des pages connectées : barre d'application, synchronisation hors ligne et verrouillage.
export function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isOnline = useOnlineStatus()
  const { data: currentCashSession } = useCurrentCashSession()
  const cashSessionId = currentCashSession?.id

  // Rejoue la file d'attente au démarrage, au retour du réseau et à intervalle régulier
  const userId = user?.id
  useEffect(() => (userId ? startAutoSync(userId) : undefined), [userId])

  // Garde des numéros d'addition en réserve pour pouvoir vendre si le réseau se coupe
  useEffect(() => {
    if (cashSessionId && isOnline) {
      void refreshNumbering(cashSessionId).catch(() => undefined)
    }
  }, [cashSessionId, isOnline])

  // Les toasts d'une page ne doivent pas suivre l'utilisateur sur la suivante
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
