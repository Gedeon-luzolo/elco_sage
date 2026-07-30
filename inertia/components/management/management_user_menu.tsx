import { router } from '@inertiajs/react'
import { Home, LogOut, UserRound } from 'lucide-react'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '~/components/ui/sidebar'
import type { InertiaProps } from '~/types'

interface ManagementUserMenuProps {
  user: InertiaProps['user']
}

// Profil et actions rapides placés dans le footer de la sidebar management.
export function ManagementUserMenu({ user }: ManagementUserMenuProps) {
  if (!user) {
    return null
  }

  const displayName = user.fullName || user.email

  // Déconnecte l'utilisateur depuis le footer de la sidebar.
  const logout = () => {
    router.post('/logout')
  }

  // Retourne à l'accueil depuis le footer de la sidebar.
  const goHome = () => {
    router.visit('/')
  }

  return (
    <div className="grid gap-2">
      <div className="flex min-w-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 text-primary-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
          <UserRound className="size-4" />
        </span>
        <span className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate font-medium">{displayName}</span>
          <span className="truncate text-xs text-primary-foreground/70">{user.role}</span>
        </span>
      </div>

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton type="button" tooltip="Accueil" onClick={goHome}>
            <Home className="size-4" />
            <span>Accueil</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Se déconnecter"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="size-4" />
            <span>Se déconnecter</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  )
}
