import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { DoorClosed, LogOut, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type Data } from '@generated/data'
import { CashSessionClosingDialog } from '~/components/sales/cash_session_closing_dialog'
import { Button } from '~/components/ui/button'
import type { CashSessionItem } from '~/types/cash_session_types'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface AppBarProps {
  user: Data.User
  exchangeRate: Data.ExchangeRate | undefined
  currentCashSession: CashSessionItem | undefined
}

export function AppBar({ user, exchangeRate, currentCashSession }: AppBarProps) {
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

  const displayName = user.fullName!

  // Ouvre le formulaire de cloture depuis le menu profil.
  const openCashSessionClosingDialog = () => {
    setIsProfileMenuOpen(false)
    setIsClosingDialogOpen(true)
  }

  // Ferme la session depuis le menu profil.
  const logout = () => {
    setIsLoggingOut(true)
    router.post('/logout', undefined, {
      onFinish: () => setIsLoggingOut(false),
    })
  }

  return (
    <header className="flex min-h-16 w-full items-center justify-between border-b border-border bg-background px-4 py-3 text-foreground shadow-sm sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2b1810] text-xl font-bold text-amber-50">
          e
        </span>
        <span className="truncate text-sm font-semibold sm:text-base">Elco Sage</span>
      </Link>

      <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 text-right">
          {exchangeRate ? (
            <div className="flex min-w-0 flex-col gap-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs lg:flex-row lg:items-center lg:gap-4">
              <span>
                Taux de change : 1 USD = {formatMoneyWithCurrency(exchangeRate.exchangeRate, 'CDF')}
              </span>
              <span>
                Taux de vente : 1 USD = {formatMoneyWithCurrency(exchangeRate.sellRate, 'CDF')}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Aucun taux disponible</div>
          )}
        </div>

        <div ref={profileMenuRef} className="relative shrink-0">
          <Button
            type="button"
            size="icon-lg"
            className="rounded-full font-semibold"
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

              {currentCashSession && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    role="menuitem"
                    className="w-full justify-start rounded-sm text-amber-700"
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
                {isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}
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
