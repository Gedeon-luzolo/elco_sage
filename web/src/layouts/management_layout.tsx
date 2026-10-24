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
      {/* min-w-0 : un tableau large défile dans la page au lieu d'élargir le layout. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{title}</h1>
        </header>

        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
