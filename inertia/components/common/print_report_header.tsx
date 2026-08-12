import elcoPrintLogo from '~/images/elco_print.png'
import { formatDateTimeLabel } from '~/utils/date'

interface PrintReportHeaderProps {
  title: string
  description?: string
}

/**
 * En-tête commun des rapports imprimés: logo ELCO, titre, contexte et date d'impression.
 */
export function PrintReportHeader({ title, description }: PrintReportHeaderProps) {
  return (
    <header className="mb-3 flex items-center justify-between gap-4 border-b border-black pb-2 text-black">
      <div className="flex items-center gap-3">
        <img src={elcoPrintLogo} alt="ELCO SAGE" className="h-16 w-24 object-contain" />
        <div>
          <h1 className="text-lg font-bold uppercase leading-tight">{title}</h1>
          {description && <p className="mt-1 text-[11px] leading-snug">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 text-right text-[10px]">
        <p className="font-semibold">ELCO SAGE</p>
        <p>Imprimé le {formatDateTimeLabel(new Date())}</p>
      </div>
    </header>
  )
}
