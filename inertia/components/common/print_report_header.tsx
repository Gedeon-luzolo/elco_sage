import type { ReactNode } from 'react'
import elcoPrintLogo from '~/images/elco_print.png'

interface PrintReportHeaderProps {
  title: string
  description?: ReactNode
  details?: ReactNode
  actions?: ReactNode
}

/**
 * En-tête commun des rapports imprimés: logo ELCO, titre, contexte et date d'impression.
 */
export function PrintReportHeader({ title, description, details, actions }: PrintReportHeaderProps) {
  return (
    <header className="mb-3 flex items-center justify-between gap-6 border-b border-black pb-3 text-black">
      <div className="flex min-w-0 items-center gap-3">
        <img src={elcoPrintLogo} alt="ELCO SAGE" className="h-16 w-24 object-contain" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold uppercase leading-tight">{title}</h1>
          {description && <p className="mt-1 text-[11px] leading-snug">{description}</p>}
          {details && (
            <div className="mt-3 flex max-w-5xl flex-wrap gap-x-8 gap-y-2 text-[11px]">
              {details}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3 text-right">
        {actions}
      </div>
    </header>
  )
}
