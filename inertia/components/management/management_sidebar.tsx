import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { ShieldCheck } from 'lucide-react'
import { ManagementUserMenu } from '~/components/management/management_user_menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '~/components/ui/sidebar'
import { MANAGEMENT_MODULES } from '~/constants/modules'
import type { InertiaProps } from '~/types'

// Navigation interne du module management.
export function ManagementSidebar() {
  const { props, url } = usePage<InertiaProps>()

  // La page dashboard doit être active uniquement sur /management.
  const isActiveItem = (href: string) => {
    if (href === '/management') {
      return url === href
    }

    return url.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Management">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#2b1810] text-amber-50">
                <ShieldCheck className="size-4" />
              </span>
              <span className="font-semibold">Management</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Rubriques</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MANAGEMENT_MODULES.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActiveItem(item.href)}
                      tooltip={item.title}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ManagementUserMenu user={props.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
