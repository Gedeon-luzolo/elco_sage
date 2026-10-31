import { ArrowLeft, Banknote, FileText, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '~/components/common/page_header'
import { SaleServiceGrid } from '~/components/sales/sale_service_grid'
import { SaleTicketFields } from '~/components/sales/sale_ticket_fields'
import { SaleTicketSummary } from '~/components/sales/sale_ticket_summary'
import { TicketLineList, TicketPage, TicketWorkspace } from '~/components/sales/ticket_layout'
import { ThermalSaleReceipt } from '~/components/sales/thermal_sale_receipt'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { usePrintInvoice } from '~/hooks/use_print_invoice'
import { useCrud } from '~/hooks/common/useCrud'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useCreateSale } from '~/hooks/sales/useCreateSale'
import { useTicketLines } from '~/hooks/sales/useTicketLines'
import { invalidateQueriesByPrefix } from '~/lib/react-query/query_client'
import { buildLocalSale } from '~/utils/sales/local_sale'
import type { PaymentMethod } from '~/utils/sales/payment.utils'
import type { CustomerDTO, ProductServiceDTO } from '~/types/dto'
import type { ProformaRow } from '~/types/proforma_types'
import type { SaleItemRow } from '~/types/sale_types'
import type { UserSummaryDTO } from '~/types/dto'
import { Currency, type CurrencyCode } from '~/utils/currency'
import { formatProformaNumber } from '~/utils/sales/proforma.utils'
import {
  buildCreateSalePayload,
  canSubmitSaleForm,
  type SaleLineState,
  type SalePaymentType,
} from '~/utils/sales/sale.utils'

const EMPTY_SERVICES: ProductServiceDTO[] = []

// Le ticket est toujours celui de la vente chargée par le serveur : aucune sélection manuelle ici.
const ignoreSaleSelection = () => {}

// Onglets du ticket : les lignes d'un côté, les informations de paiement de l'autre.
type TicketTab = 'lines' | 'payment'

export default function SaleCreatePage() {
  const navigate = useNavigate()
  const { data: currentCashSession } = useCurrentCashSession()

  // Données de référence de la vente
  const { user } = useAuth()
  const { data: saleServices = EMPTY_SERVICES } = useCrud<ProductServiceDTO>({
    endpoint: '/product-services/active-for-sale',
  }).useList()
  const { data: operators = [] } = useCrud<UserSummaryDTO>({ endpoint: '/operators' }).useList()
  const { data: customers = [] } = useCrud<CustomerDTO>({
    endpoint: '/customers/active-for-sale',
  }).useList()

  // En ligne la vente part au serveur ; sans réseau elle va dans la file d'attente
  const createSale = useCreateSale()

  // Derniere vente enregistree : son ticket est imprime automatiquement.
  const [printSale, setPrintSale] = useState<SaleItemRow | null>(null)
  const [autoPrintSaleId, setAutoPrintSaleId] = useState<string | null>(null)

  const [paymentType, setPaymentType] = useState<SalePaymentType>('CASH')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentReference, setPaymentReference] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>(Currency.CDF)
  const [operatorId, setOperatorId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const ticket = useTicketLines<SaleLineState>({
    services: saleServices,
    currency,
    createLine: (productServiceId) => ({ productServiceId, quantity: 1 }),
  })
  const { lines, theoreticalAmount, discountAmount } = ticket
  const [ticketTab, setTicketTab] = useState<TicketTab>('lines')
  const isSubmitting = createSale.isPending

  // Conversion d'une proforma : la liste l'envoie dans le state de navigation
  const location = useLocation()
  const sourceProforma = (location.state as { proforma?: ProformaRow } | null)?.proforma ?? null
  const [prefilledProformaId, setPrefilledProformaId] = useState<string | null>(null)

  // Le ticket est rempli une seule fois ; seule une proforma encore émise se convertit.
  if (sourceProforma?.status === 'ISSUED' && prefilledProformaId !== sourceProforma.id) {
    setPrefilledProformaId(sourceProforma.id)
    ticket.resetTicket({
      lines: sourceProforma.items.map((item) => ({
        productServiceId: item.productServiceId,
        quantity: item.quantity,
      })),
      payableAmount: sourceProforma.discountAmount > 0 ? sourceProforma.totalAmount : undefined,
    })
    setCurrency(sourceProforma.currency as CurrencyCode)
    setCustomerId(sourceProforma.customerId)
  }

  const linkedProforma =
    sourceProforma && sourceProforma.id === prefilledProformaId ? sourceProforma : null

  // Imprime automatiquement le ticket de la vente venant d'être enregistrée.
  const { receiptRef } = usePrintInvoice({
    selectedSale: printSale,
    autoPrintSaleId,
    onAutoPrinted: () => setAutoPrintSaleId(null),
    onSelectSale: ignoreSaleSelection,
  })

  // Vérifie si le formulaire peut être soumis, en tenant compte des champs requis.
  const canSubmit = canSubmitSaleForm({
    currentCashSessionId: currentCashSession?.id,
    paymentType,
    operatorId,
    customerId,
    discountAmount,
    lines,
  })

  // Champs obligatoires encore vides : ils sont signalés sur l'onglet Paiement
  const requiresCustomer = paymentType !== 'CASH' || discountAmount > 0
  const operatorMissing = !operatorId
  const customerMissing = requiresCustomer && !customerId
  const hasMissingField = operatorMissing || customerMissing

  /**
   * Ajoute un service ; l'ajout se voit tout de suite, on revient donc sur les lignes.
   */
  const pickService = (serviceId: string) => {
    setTicketTab('lines')
    ticket.pickService(serviceId)
  }

  /**
   * Remet le formulaire à zéro après une vente enregistrée.
   */
  const resetForm = () => {
    setPaymentType('CASH')
    setPaymentMethod('CASH')
    setPaymentReference('')
    setCustomerId('')
    ticket.resetTicket({ lines: [] })
    setTicketTab('lines')
  }

  /**
   * Enregistre la vente via le backend.
   */
  const submitSale = () => {
    // Un champ requis manque : on ouvre l'onglet Paiement où il est signalé
    if (hasMissingField) {
      setTicketTab('payment')
      return
    }

    if (!canSubmit) return

    if (!currentCashSession || !user) return

    const payload = {
      ...buildCreateSalePayload({
        paymentType,
        paymentMethod,
        paymentReference,
        customerId,
        operatorId,
        currency,
        payableAmount: ticket.payableAmount,
        theoreticalAmount,
        lines,
      }),
      // Le serveur marque la proforma comme convertie avec la vente
      proformaId: linkedProforma?.id ?? null,
    }

    createSale.mutate(
      {
        cashSessionId: currentCashSession.id,
        payload,
        buildSale: (meta) =>
          buildLocalSale({
            ...meta,
            cashSessionId: currentCashSession.id,
            payload,
            services: saleServices,
            customers,
            operators,
            seller: user,
          }),
      },
      {
        // Le formulaire est vidé après succès pour enchaîner la vente suivante sur la même page.
        onSuccess: ({ sale }) => {
          setPrintSale(sale)
          setAutoPrintSaleId(sale.id)
          resetForm()

          // La vente suivante ne reprend pas la proforma. prefilledProformaId garde son id :
          // tant que le state porte encore la proforma, elle ne doit pas re-remplir le ticket.
          if (linkedProforma) {
            invalidateQueriesByPrefix('/proformas')
            navigate(location.pathname, { replace: true, state: null })
          }
        },
      }
    )
  }

  return (
    <TicketPage
      // Le ticket reste monté hors écran pour que react-to-print puisse le lire via ref.
      hidden={
        <div ref={receiptRef} className="bg-white">
          {printSale && <ThermalSaleReceipt sale={printSale} />}
        </div>
      }
      header={
        <PageHeader
          title="Nouvelle vente"
          description="Enregistrer une vente de services dans la session de caisse courante."
          icon={ShoppingCart}
          accentClassName={MODULE_HEADER_ACCENTS.sales}
        >
          <Button type="button" variant="outline" onClick={() => navigate('/sales')}>
            <ArrowLeft className="size-4" />
            Retour
          </Button>
        </PageHeader>
      }
    >
      {linkedProforma && (
        <p className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
          <FileText className="size-4" />
          Vente issue de la proforma N°{formatProformaNumber(linkedProforma)} (
          {linkedProforma.customer?.fullName ?? '-'}).
        </p>
      )}
      {sourceProforma && sourceProforma.status !== 'ISSUED' && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <FileText className="size-4" />
          La proforma N°{formatProformaNumber(sourceProforma)} est déjà convertie ou annulée.
        </p>
      )}

      {!currentCashSession ? (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Banknote className="size-5" />
            Ouvrez une session de caisse avant d&apos;enregistrer une vente.
          </CardContent>
        </Card>
      ) : (
        <TicketWorkspace
          catalog={
            <SaleServiceGrid
              services={saleServices}
              currency={currency}
              quantityByServiceId={ticket.quantityByServiceId}
              onPick={pickService}
            />
          }
        >
          <Tabs
            value={ticketTab}
            onValueChange={(value) => setTicketTab(value as TicketTab)}
            className="min-h-0 flex-1 flex-col gap-0"
          >
            {/* Onglets de hauteur fixe : passer de l'un à l'autre ne déplace jamais le total */}
            <TabsList className="m-3 mb-0 h-12! w-auto shrink-0">
              <TabsTrigger value="lines" className="h-full! text-sm">
                Articles ({lines.length})
              </TabsTrigger>
              <TabsTrigger value="payment" className="h-full! text-sm">
                Paiement
                {hasMissingField && (
                  <span className="size-2 rounded-full bg-destructive">
                    <span className="sr-only">Champ requis manquant</span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lines" className="min-h-0 overflow-y-auto px-4 pt-1">
              <TicketLineList
                lines={lines}
                serviceById={ticket.serviceById}
                currency={currency}
                emptyMessage="Touchez un service pour l'ajouter au ticket."
                onChange={ticket.updateLine}
                onRemove={ticket.removeLine}
              />
            </TabsContent>

            <TabsContent value="payment" className="min-h-0 overflow-y-auto">
              <SaleTicketFields
                payment={{
                  paymentType,
                  onPaymentTypeChange: setPaymentType,
                  paymentMethod,
                  onPaymentMethodChange: setPaymentMethod,
                  paymentReference,
                  onPaymentReferenceChange: setPaymentReference,
                  operatorId,
                  onOperatorChange: setOperatorId,
                  operators,
                  operatorMissing,
                }}
                currency={currency}
                onCurrencyChange={setCurrency}
                customerId={customerId}
                onCustomerChange={setCustomerId}
                customers={customers}
                onCustomerCreated={(customer) => setCustomerId(customer.id)}
                customerMissing={customerMissing}
              />
            </TabsContent>
          </Tabs>

          {/* Le résumé reste sous les onglets, toujours visible */}
          <SaleTicketSummary
            currency={currency}
            theoreticalAmount={theoreticalAmount}
            payableAmount={ticket.payableAmount}
            onPayableAmountChange={ticket.changePayableAmount}
            discountAmount={discountAmount}
            totalAmount={ticket.payableAmount}
            // Le bouton reste actif malgré un champ manquant : il ouvre alors l'onglet Paiement
            canSubmit={lines.length > 0}
            isSubmitting={isSubmitting}
            onSubmit={submitSale}
          />
        </TicketWorkspace>
      )}
    </TicketPage>
  )
}
