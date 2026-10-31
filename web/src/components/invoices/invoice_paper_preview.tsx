import { COMPANY } from '~/constants/company'
import elcoPrintLogo from '~/images/elco_print.png'
import type { InvoiceDocument } from '~/utils/invoices/invoice.utils'
import { businessDateKey, formatDateLabel } from '~/utils/date'
import { formatNumber } from '~/utils/format_number.utils'

/**
 * Aperçu à l'écran de la facture A4, mise en page comme le PDF (en-tête, tableau, total).
 * Toujours sur fond blanc, comme la feuille imprimée, quel que soit le thème.
 */
export function InvoicePaperPreview({ invoice }: { invoice: InvoiceDocument }) {
  const currencySymbol = invoice.currency === 'USD' ? '$' : 'FC'
  const cell = 'border-l border-black px-2 py-1.5 first:border-l-0'

  return (
    <div className="bg-white p-8 text-[12px] text-black shadow-xl" style={{ colorScheme: 'light' }}>
      <div className="flex items-center gap-4">
        <img src={elcoPrintLogo} alt="Elco Print" className="size-16 object-contain" />
        <div className="font-serif text-[13px] leading-snug font-bold text-[#1f2a5c]">
          <p>R.C.C.M {COMPANY.rccm}</p>
          <p>ID. NAT.: {COMPANY.idNat}</p>
          <p>IMPOT: {COMPANY.taxNumber}</p>
        </div>
      </div>
      <div className="mt-1.5 h-0.5 w-3/5 bg-[#2443a8]" />

      <p className="mt-8 text-center font-serif text-[17px] font-bold">
        <span className="underline">{invoice.title}</span> N°{invoice.reference}
      </p>
      <p className="mt-6 mb-4 text-[13px]">
        <span className="font-bold">Nom du Client :</span>{' '}
        {invoice.customerName?.toUpperCase() ?? '-'}
      </p>

      <div className="border border-black">
        <div className="grid grid-cols-[32px_minmax(0,1fr)_44px_64px_72px] border-b border-black bg-[#bdd7ee] font-bold">
          <span className={cell}>N°</span>
          <span className={`${cell} text-center`}>DESIGNATION</span>
          <span className={cell}>Qté.</span>
          <span className={cell}>P.U ({currencySymbol})</span>
          <span className={cell}>P.T ({currencySymbol})</span>
        </div>
        {invoice.lines.map((line) => (
          <div
            key={line.position}
            className="grid grid-cols-[32px_minmax(0,1fr)_44px_64px_72px] border-b border-black"
          >
            <span className={`${cell} text-center`}>{line.position}</span>
            <span className={cell}>{line.designation}</span>
            <span className={`${cell} text-right`}>{formatNumber(line.quantity)}</span>
            <span className={`${cell} text-right`}>{formatNumber(line.unitPrice)}</span>
            <span className={`${cell} text-right`}>{formatNumber(line.totalPrice)}</span>
          </div>
        ))}
        {invoice.discountAmount > 0 && (
          <>
            <PaperTotalRow label="SOUS-TOTAL" amount={invoice.theoreticalAmount} />
            <PaperTotalRow label="REMISE" amount={invoice.discountAmount} />
          </>
        )}
        <PaperTotalRow label="TOTAL" amount={invoice.totalAmount} last />
      </div>

      <div className="mt-6 ml-auto w-fit text-center text-[13px]">
        <p>
          Fait à {COMPANY.city}, Le {formatDateLabel(businessDateKey(invoice.issuedAt))}
        </p>
        <p className="mt-1.5 font-bold">Caisse</p>
      </div>

      {/* Lien avec le ticket imprimé hors ligne, ou mention de la facture provisoire */}
      {invoice.note && <p className="mt-6 text-[12px] italic">{invoice.note}</p>}
    </div>
  )
}

function PaperTotalRow({
  label,
  amount,
  last = false,
}: {
  label: string
  amount: number
  last?: boolean
}) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_72px] bg-[#9dc3e6] font-bold ${last ? '' : 'border-b border-black'}`}
    >
      <span className="px-2 py-1.5 text-center">{label}</span>
      <span className="border-l border-black px-2 py-1.5 text-right">{formatNumber(amount)}</span>
    </div>
  )
}
