import elcoPrintLogo from '~/images/elco_print.png'
import type { SaleItemRow } from '~/types/sale_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateTimeLabel } from '~/utils/date'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'

interface ThermalSaleReceiptProps {
  sale: SaleItemRow
}

export function ThermalSaleReceipt({ sale }: ThermalSaleReceiptProps) {
  const saleCurrency = sale.currency as CurrencyCode

  return (
    <section
      className="min-h-[210mm] w-[72.1mm] bg-white p-[4mm] font-sans text-[9px] leading-tight text-black"
      style={{ colorScheme: 'light' }}
    >
      <header className="text-center">
        <img
          src={elcoPrintLogo}
          alt="ELCO SAGE"
          className="mx-auto mb-[1mm] h-[35mm] w-[50mm] object-contain"
        />
        <p className="mt-[1mm]">Facture de vente</p>
        <p className="mt-[1mm] text-center text-[18px] font-bold leading-none">
          {sale.additionNumber}
        </p>
      </header>

      <div className="mt-[2mm]">
        <ReceiptLine label="Date" value={formatDateTimeLabel(sale.saleDate)} />
        {sale.customer && <ReceiptLine label="Client" value={sale.customer.fullName} />}
        <ReceiptLine label="Operateur" value={sale.operatorName ?? '-'} />
        <ReceiptLine label="Paiement" value={sale.paymentType} />
      </div>

      <div className="my-[2mm] border-t border-dashed border-black" />

      <div>
        {sale.items.map((item) => (
          <article key={item.id} className="break-inside-avoid py-[1mm]">
            <div className="flex justify-between gap-[3mm] font-semibold">
              <span className="min-w-0">{item.productService?.name ?? 'Service inconnu'}</span>
              <strong className="text-right">
                {formatMoneyWithCurrency(item.totalPrice, item.currency as CurrencyCode)}
              </strong>
            </div>
            <div className="mt-[0.5mm] flex justify-between gap-[3mm] text-[8px]">
              <span className="min-w-0">Bon {item.orderNumber}</span>
              <span>
                {item.quantity} x{' '}
                {formatMoneyWithCurrency(item.unitPrice, item.currency as CurrencyCode)}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="my-[2mm] border-t border-dashed border-black" />

      <div className="mt-[2mm]">
        <ReceiptLine
          label="Sous-total"
          value={formatMoneyWithCurrency(sale.theoreticalAmount, saleCurrency)}
        />
        <ReceiptLine
          label="Remise"
          value={formatMoneyWithCurrency(sale.discountAmount, saleCurrency)}
        />
        <ReceiptLine
          label="Total"
          value={formatMoneyWithCurrency(sale.totalAmount, saleCurrency)}
          strong
        />
      </div>

      <footer className="mt-[3mm] text-center">
        <p className="mt-[1mm]">Merci pour votre confiance.</p>
        <p className="mt-[1mm]">Date d'impression: {formatDateTimeLabel(new Date())}</p>
      </footer>
    </section>
  )
}

function ReceiptLine({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex justify-between gap-[3mm]">
      <span className="min-w-0">{label}</span>
      <strong className={strong ? 'text-right text-[12px]' : 'text-right'}>{value}</strong>
    </div>
  )
}
