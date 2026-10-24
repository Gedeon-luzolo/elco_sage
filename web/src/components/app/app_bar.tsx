import { AppLink as Link } from '~/components/common/app_link'
import { DoorClosed, LogOut, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SyncStatus } from '~/components/app/sync_status'
import { BrandLogo } from '~/components/brand/brand_logo'
import { CashSessionClosingDialog } from '~/components/sales/cash_session_closing_dialog'
import { Button } from '~/components/ui/button'
import { useAuth } from '~/hooks/auth/useAuth'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useCurrentExchangeRate } from '~/hooks/sales/useExchangeRate'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

export function AppBar() {
  const { user: authUser, logout: endSession } = useAuth()
  const { data: exchangeRate } = useCurrentExchangeRate()
  const { data: currentCashSession } = useCurrentCashSession()
  const isOnline = useOnlineStatus()
  const user = authUser!
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Ferme le menu profil quand l'utilisateur clique ailleurs.
  useEffect(() => {
    const closeProfileMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeProfileMenu)

    return () => {
      document.removeEventListener('mousedown', closeProfileMenu)
    }
  }, [])

  const displayName = user.fullName ?? user.email

  // Ouvre le formulaire de clôture depuis le menu profil.
  const openCashSessionClosingDialog = () => {
    setIsProfileMenuOpen(false)
    setIsClosingDialogOpen(true)
  }

  // Ferme la session depuis le menu profil.
  const logout = () => {
    setIsLoggingOut(true)
    void endSession().finally(() => setIsLoggingOut(false))
  }

  return (
    <header className="flex min-h-16 w-full items-center justify-between border-b-2 border-primary bg-background px-4 py-3 text-foreground sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <BrandLogo className="h-9 w-auto shrink-0 object-contain" />
        <span className="sr-only">Elco Sage</span>
      </Link>

      <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
        <SyncStatus />
        {exchangeRate ? (
          <div className="hidden min-w-0 flex-col gap-0.5 text-[11px] leading-tight text-muted-foreground sm:flex sm:text-xs lg:flex-row lg:items-center lg:gap-4">
            <span>
              Taux de change : 1 USD = {formatMoneyWithCurrency(exchangeRate.exchangeRate, 'CDF')}
            </span>
            <span>
              Taux de vente : 1 USD = {formatMoneyWithCurrency(exchangeRate.sellRate, 'CDF')}
            </span>
          </div>
        ) : (
          <div className="hidden text-xs text-muted-foreground sm:block">Aucun taux disponible</div>
        )}

        <div ref={profileMenuRef} className="relative shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full border-primary bg-transparent font-semibold text-primary hover:bg-primary/10"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="menu"
            aria-label={`Ouvrir le profil de ${displayName}`}
            title={displayName}
            onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
          >
            {user.initials}
          </Button>

          {isProfileMenuOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
              role="menu"
            >
              <div className="px-3 py-2">
                <span className="block truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
              </div>

              <div className="my-1 h-px bg-border" />

              <Button
                type="button"
                variant="outline"
                role="menuitem"
                className="w-full justify-start rounded-sm"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <UserRound className="size-4" />
                Profil
              </Button>

              <div className="my-1 h-px bg-border" />

              {/* La clôture se fait en ligne uniquement */}
              {currentCashSession && isOnline && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    role="menuitem"
                    className="w-full justify-start rounded-sm text-blue-700"
                    onClick={openCashSessionClosingDialog}
                  >
                    <DoorClosed className="size-4" />
                    Fermer la caisse
                  </Button>

                  <div className="my-1 h-px bg-border" />
                </>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start rounded-sm text-destructive"
                disabled={isLoggingOut}
                role="menuitem"
                onClick={logout}
              >
                <LogOut className="size-4" />
                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {currentCashSession && (
        <CashSessionClosingDialog
          open={isClosingDialogOpen}
          currentCashSession={currentCashSession}
          onOpenChange={setIsClosingDialogOpen}
        />
      )}
    </header>
  )
}
