import type { ReactNode } from 'react'
import { ManagementSidebar } from '~/components/management/management_sidebar'
import { Separator } from '~/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'

interface ManagementLayoutProps {
  title: string
  children: ReactNode
}

// Layout commun aux pages internes du module management.
export function ManagementLayout({ title, children }: ManagementLayoutProps) {
  return (
    <SidebarProvider>
      <ManagementSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{title}</h1>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-26  px-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
