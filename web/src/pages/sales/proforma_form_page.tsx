import { ArrowLeft, FileText, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '~/components/common/page_header'
import { SaleServiceGrid } from '~/components/sales/sale_service_grid'
import { SaleTicketFields } from '~/components/sales/sale_ticket_fields'
import { SaleTicketSummary } from '~/components/sales/sale_ticket_summary'
import { TicketLineList, TicketPage, TicketWorkspace } from '~/components/sales/ticket_layout'
import { Button } from '~/components/ui/button'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { useCrud } from '~/hooks/common/useCrud'
import { useTicketLines } from '~/hooks/sales/useTicketLines'
import { useOnlineStatus } from '~/hooks/useOnlineStatus'
import type { CustomerDTO, ProductServiceDTO } from '~/types/dto'
import type { ProformaRow } from '~/types/proforma_types'
import { Currency, type CurrencyCode } from '~/utils/currency'
import type { SaleLineState } from '~/utils/sales/sale.utils'
import { buildProformaPayload, formatProformaNumber } from '~/utils/sales/proforma.utils'

const EMPTY_SERVICES: ProductServiceDTO[] = []

// Création (sans id) ou modification (avec id) d'une proforma.
export default function ProformaFormPage() {
  const { id } = useParams()
  const location = useLocation()
  // La liste ouvre la modification avec la proforma dans le state de navigation
  const proforma = (location.state as { proforma?: ProformaRow } | null)?.proforma ?? null

  // Après un rechargement le state est perdu : on repart de la liste plutôt que d'un formulaire vide
  if (id && proforma?.id !== id) {
    return <Navigate to="/sales/proformas" replace />
  }

  return <ProformaForm key={proforma?.id ?? 'new'} proforma={proforma} />
}

function ProformaForm({ proforma }: { proforma: ProformaRow | null }) {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()

  // Données de référence : les mêmes services et clients que la caisse
  const { data: services = EMPTY_SERVICES } = useCrud<ProductServiceDTO>({
    endpoint: '/product-services/active-for-sale',
  }).useList()
  const { data: customers = [] } = useCrud<CustomerDTO>({
    endpoint: '/customers/active-for-sale',
  }).useList()

  const { useCreate, usePatch } = useCrud<ProformaRow>({
    endpoint: '/proformas',
    showSuccessToast: false,
  })
  const createProforma = useCreate<ReturnType<typeof buildProformaPayload>, ProformaRow>()
  const updateProforma = usePatch<ReturnType<typeof buildProformaPayload>>()
  const isSubmitting = createProforma.isPending || updateProforma.isPending

  // En modification, le formulaire repart du contenu enregistré
  const [customerId, setCustomerId] = useState(proforma?.customerId ?? '')
  const [currency, setCurrency] = useState<CurrencyCode>(
    (proforma?.currency as CurrencyCode | undefined) ?? Currency.CDF
  )
  const [submitted, setSubmitted] = useState(false)

  const ticket = useTicketLines<SaleLineState>({
    services,
    currency,
    createLine: (productServiceId) => ({ productServiceId, quantity: 1 }),
    initialLines: proforma?.items.map((item) => ({
      productServiceId: item.productServiceId,
      quantity: item.quantity,
    })),
    // Une proforma remisée garde son montant à payer
    initialPayableAmount:
      proforma && proforma.discountAmount > 0 ? proforma.totalAmount : undefined,
  })

  // Le client n'est signalé qu'après une première tentative d'enregistrement
  const customerMissing = submitted && !customerId

  // Retour à la liste, la proforma enregistrée sélectionnée pour la télécharger
  const openInList = (proformaId: string) => {
    navigate('/sales/proformas', { state: { selectedProformaId: proformaId } })
  }

  /**
   * Enregistre la proforma : création ou remplacement de son contenu.
   */
  const submitProforma = () => {
    setSubmitted(true)

    if (!customerId || ticket.lines.length === 0) return

    const payload = buildProformaPayload({
      customerId,
      currency,
      discountAmount: ticket.discountAmount,
      lines: ticket.lines,
    })

    if (proforma) {
      updateProforma.mutate(
        { id: proforma.id, data: payload },
        { onSuccess: () => openInList(proforma.id) }
      )
      return
    }

    createProforma.mutate(payload, { onSuccess: (created) => openInList(created.id) })
  }

  return (
    <TicketPage
      header={
        <PageHeader
          title={proforma ? `Proforma N°${formatProformaNumber(proforma)}` : 'Nouvelle proforma'}
          description={
            proforma
              ? 'Modifier le contenu de la proforma ; son numéro et sa date restent inchangés.'
              : 'Préparer une facture proforma à remettre au client, sans passer par la caisse.'
          }
          icon={FileText}
          accentClassName={MODULE_HEADER_ACCENTS.sales}
        >
          <Button type="button" variant="outline" onClick={() => navigate('/sales/proformas')}>
            <ArrowLeft className="size-4" />
            Retour
          </Button>
        </PageHeader>
      }
    >
      {/* Le numéro est attribué par le serveur : pas de proforma hors ligne */}
      {!isOnline && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <WifiOff className="size-4" />
          Connexion au serveur requise pour enregistrer une proforma.
        </p>
      )}

      <TicketWorkspace
        catalog={
          <SaleServiceGrid
            services={services}
            currency={currency}
            quantityByServiceId={ticket.quantityByServiceId}
            onPick={ticket.pickService}
          />
        }
      >
        <div className="border-b border-border">
          <SaleTicketFields
            customerId={customerId}
            onCustomerChange={setCustomerId}
            currency={currency}
            onCurrencyChange={setCurrency}
            customers={customers}
            customerMissing={customerMissing}
            customerRequired
            onCustomerCreated={(customer) => setCustomerId(customer.id)}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <TicketLineList
            lines={ticket.lines}
            serviceById={ticket.serviceById}
            currency={currency}
            emptyMessage="Touchez un service pour l'ajouter à la proforma."
            onChange={ticket.updateLine}
            onRemove={ticket.removeLine}
          />
        </div>

        <SaleTicketSummary
          currency={currency}
          theoreticalAmount={ticket.theoreticalAmount}
          payableAmount={ticket.payableAmount}
          onPayableAmountChange={ticket.changePayableAmount}
          discountAmount={ticket.discountAmount}
          totalAmount={ticket.payableAmount}
          canSubmit={ticket.lines.length > 0 && isOnline}
          isSubmitting={isSubmitting}
          submitLabel={proforma ? 'Enregistrer les modifications' : 'Enregistrer la proforma'}
          onSubmit={submitProforma}
        />
      </TicketWorkspace>
    </TicketPage>
  )
}
