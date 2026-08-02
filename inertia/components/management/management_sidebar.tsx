import { Link } from '@adonisjs/inertia/react'
import { usePage } from '@inertiajs/react'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import { ManagementUserMenu } from '~/components/management/management_user_menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
                  <Collapsible
                    key={item.href}
                    render={<SidebarMenuItem />}
                    defaultOpen={
                      isActiveItem(item.href) ||
                      (item.subItems && item.subItems.some((sub) => isActiveItem(sub.href)))
                    }
                    className="group/collapsible"
                  >
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActiveItem(item.href)}
                        tooltip={item.title}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>

                      {item.subItems && (
                        <>
                          <CollapsibleTrigger
                            render={
                              <SidebarMenuAction
                                className="left-auto right-1 data-[state=open]:rotate-90 transition-transform"
                                showOnHover
                              />
                            }
                          >
                            <ChevronRight />
                            <span className="sr-only">Toggle</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.subItems.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton
                                    render={<Link href={subItem.href} />}
                                    isActive={isActiveItem(subItem.href)}
                                  >
                                    {subItem.title}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </>
                      )}
                  </Collapsible>
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
