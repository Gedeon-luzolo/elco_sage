import { cn } from '~/lib/utils'
import type { ProformaRow, ProformaStatus } from '~/types/proforma_types'
import type { CurrencyCode } from '~/utils/currency'
import { formatDateLabel } from '~/utils/date'
import { formatMoneyWithCurrency, formatNumber } from '~/utils/format_number.utils'
import { formatProformaNumber, PROFORMA_STATUS_LABELS } from '~/utils/sales/proforma.utils'

// Couleur du tampon posé sur la miniature, selon le statut.
const STAMP_CLASSES: Record<ProformaStatus, string> = {
  ISSUED: 'border-[#2443a8] text-[#2443a8]',
  CONVERTED: 'border-emerald-700 text-emerald-700',
  CANCELLED: 'border-red-700 text-red-700',
}

// Lignes du tableau reprises sur le bon : au plus quatre, les suivantes sont comptées.
const MAX_THUMB_ROWS = 4

interface ProformasGalleryViewProps {
  proformas: ProformaRow[]
  selectedId: string | null
  // Sans détail ouvert, la grille prend toute la largeur : plus de bons par ligne
  expanded: boolean
  onSelect: (proforma: ProformaRow) => void
}

/**
 * Les proformas en bons : le tableau de la facture, un tampon de statut et le bord perforé.
 */
export function ProformasGalleryView({
  proformas,
  selectedId,
  expanded,
  onSelect,
}: ProformasGalleryViewProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2',
        expanded ? 'lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'xl:grid-cols-3'
      )}
    >
      {proformas.map((proforma) => (
        <button
          key={proforma.id}
          type="button"
          onClick={(event) => {
            // Le clic ne remonte pas jusqu'à la page, qui refermerait le détail
            event.stopPropagation()
            onSelect(proforma)
          }}
          className="flex flex-col gap-2 text-left"
        >
          {/* Le bon reste blanc quel que soit le thème, comme le document imprimé ;
              seul le tableau de la facture est repris, bord bas perforé comme un carnet */}
          {/* L'ombre et la sélection sont sur l'enveloppe : le masque des perforations les couperait */}
          <span
            className={cn(
              'block rounded-sm p-1 drop-shadow-md transition',
              proforma.id === selectedId
                ? 'bg-[#1f2a5c]/15 ring-3 ring-[#1f2a5c]'
                : 'hover:drop-shadow-lg'
            )}
          >
            <span className="relative block bg-white px-3 pt-3 pb-5 text-[10px] text-black [mask:radial-gradient(circle_5px_at_50%_100%,transparent_98%,#000)_0_0/14px_100%]">
              <span className="flex items-baseline justify-between gap-2 font-serif">
                <span className="font-bold underline">FACTURE PROFORMA</span>
                <span className="font-bold">N°{formatProformaNumber(proforma)}</span>
              </span>
              <span className="mt-1.5 block truncate">
                <b>Client :</b> {proforma.customer?.fullName.toUpperCase() ?? '-'}
              </span>

              <span className="mt-2 block border border-black">
                <span className="grid grid-cols-[minmax(0,1fr)_28px_52px] border-b border-black bg-[#bdd7ee] font-bold">
                  <span className="px-1.5 py-1">DESIGNATION</span>
                  <span className="border-l border-black px-1 py-1 text-right">Qté</span>
                  <span className="border-l border-black px-1.5 py-1 text-right">P.T</span>
                </span>
                {proforma.items.slice(0, MAX_THUMB_ROWS).map((item) => (
                  <span
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_28px_52px] border-b border-black"
                  >
                    <span className="truncate px-1.5 py-1">{item.designation}</span>
                    <span className="border-l border-black px-1 py-1 text-right">
                      {item.quantity}
                    </span>
                    <span className="border-l border-black px-1.5 py-1 text-right tabular-nums">
                      {formatNumber(item.totalPrice)}
                    </span>
                  </span>
                ))}
                {/* Les lignes au-delà de la quatrième sont seulement comptées */}
                {proforma.items.length > MAX_THUMB_ROWS && (
                  <span className="block border-b border-black px-1.5 py-1 text-center italic">
                    + {proforma.items.length - MAX_THUMB_ROWS} autre(s) ligne(s)
                  </span>
                )}
                <span className="grid grid-cols-[minmax(0,1fr)_52px] bg-[#9dc3e6] font-bold">
                  <span className="px-1.5 py-1 text-center">TOTAL</span>
                  <span className="border-l border-black px-1.5 py-1 text-right tabular-nums">
                    {formatNumber(proforma.totalAmount)}
                  </span>
                </span>
              </span>

              <span
                className={cn(
                  'absolute right-3 bottom-7 -rotate-12 rounded border-2 bg-white/70 px-2 py-0.5 text-[11px] font-extrabold tracking-wider uppercase',
                  STAMP_CLASSES[proforma.status]
                )}
              >
                {PROFORMA_STATUS_LABELS[proforma.status]}
              </span>
            </span>
          </span>

          <span className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-semibold uppercase">
              {proforma.customer?.fullName ?? '-'}
            </span>
            <span className="shrink-0 font-bold tabular-nums">
              {formatMoneyWithCurrency(proforma.totalAmount, proforma.currency as CurrencyCode)}
            </span>
          </span>
          <span className="-mt-1.5 text-xs text-muted-foreground">
            {formatDateLabel(proforma.issuedAt)}
          </span>
        </button>
      ))}
    </div>
  )
}
