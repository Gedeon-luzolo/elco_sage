import type { CSSProperties, ReactNode } from 'react'
import { SaleTicketLine } from '~/components/sales/sale_ticket_line'
import { useRemainingViewportHeight } from '~/hooks/useRemainingViewportHeight'
import type { ProductServiceDTO } from '~/types/dto'
import type { CurrencyCode } from '~/utils/currency'
import type { SaleLineState } from '~/utils/sales/sale.utils'

/**
 * Page de saisie d'un ticket : elle tient dans l'écran, seuls le catalogue et le ticket défilent.
 * hidden reçoit ce qui doit rester monté hors écran (ex : le ticket à imprimer).
 */
export function TicketPage({
  header,
  hidden,
  children,
}: {
  header: ReactNode
  hidden?: ReactNode
  children: ReactNode
}) {
  const { ref: pageRef, height: pageHeight } = useRemainingViewportHeight<HTMLElement>()

  return (
    <main
      ref={pageRef}
      style={{ '--ticket-page-height': pageHeight } as CSSProperties}
      className="flex min-h-screen flex-col bg-muted/40 text-foreground lg:h-(--ticket-page-height) lg:min-h-0 lg:overflow-hidden"
    >
      {hidden && (
        <div className="fixed left-[10000px] top-0" aria-hidden="true">
          {hidden}
        </div>
      )}

      <section className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 py-5 lg:px-10">
        {header}
        {children}
      </section>
    </main>
  )
}

/**
 * Catalogue à gauche, ticket à droite ; sur grand écran chaque colonne défile seule.
 */
export function TicketWorkspace({
  catalog,
  children,
}: {
  catalog: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_500px]">
      {catalog}

      <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:min-h-0">
        {children}
      </aside>
    </div>
  )
}

interface TicketLineListProps<Line extends SaleLineState> {
  lines: Line[]
  serviceById: Map<string, ProductServiceDTO>
  currency: CurrencyCode
  emptyMessage: string
  onChange: (index: number, patch: Partial<Line>) => void
  onRemove: (index: number) => void
}

/**
 * Lignes du ticket, ou une invitation à toucher un service tant qu'il est vide.
 */
export function TicketLineList<Line extends SaleLineState>({
  lines,
  serviceById,
  currency,
  emptyMessage,
  onChange,
  onRemove,
}: TicketLineListProps<Line>) {
  if (lines.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return lines.map((line, index) => (
    <SaleTicketLine
      key={line.productServiceId}
      line={line}
      service={serviceById.get(line.productServiceId)}
      currency={currency}
      onChange={(patch) => onChange(index, patch as Partial<Line>)}
      onRemove={() => onRemove(index)}
    />
  ))
}
