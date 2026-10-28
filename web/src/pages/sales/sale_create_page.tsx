import { ArrowLeft, Banknote, ShoppingCart } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '~/components/common/page_header'
import { SaleServiceGrid } from '~/components/sales/sale_service_grid'
import { SaleTicketFields } from '~/components/sales/sale_ticket_fields'
import { SaleTicketLine } from '~/components/sales/sale_ticket_line'
import { SaleTicketSummary } from '~/components/sales/sale_ticket_summary'
import { ThermalSaleReceipt } from '~/components/sales/thermal_sale_receipt'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { usePrintInvoice } from '~/hooks/use_print_invoice'
import { useRemainingViewportHeight } from '~/hooks/useRemainingViewportHeight'
import { useCrud } from '~/hooks/common/useCrud'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useCreateSale } from '~/hooks/sales/useCreateSale'
import { buildLocalSale } from '~/utils/sales/local_sale'
import type { PaymentMethod } from '~/utils/sales/payment.utils'
import type { CustomerDTO, ProductServiceDTO } from '~/types/dto'
import type { SaleItemRow } from '~/types/sale_types'
import type { UserSummaryDTO } from '~/types/dto'
import { Currency, type CurrencyCode } from '~/utils/currency'
import {
  buildCreateSalePayload,
  canSubmitSaleForm,
  EMPTY_SALE_LINE,
  getSaleDiscountAmountFromPayableAmount,
  getSaleLineService,
  getSaleTheoreticalAmount,
  normalizeSalePayableAmount,
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
  const [payableAmount, setPayableAmount] = useState(0)
  const [hasCustomPayableAmount, setHasCustomPayableAmount] = useState(false)
  const [lines, setLines] = useState<SaleLineState[]>([])
  const [ticketTab, setTicketTab] = useState<TicketTab>('lines')
  const isSubmitting = createSale.isPending

  // La page tient dans l'écran : seuls le catalogue et l'onglet ouvert défilent
  const { ref: pageRef, height: pageHeight } = useRemainingViewportHeight<HTMLElement>()

  // Imprime automatiquement le ticket de la vente venant d'être enregistrée.
  const { receiptRef } = usePrintInvoice({
    selectedSale: printSale,
    autoPrintSaleId,
    onAutoPrinted: () => setAutoPrintSaleId(null),
    onSelectSale: ignoreSaleSelection,
  })

  const serviceById = useMemo(
    () => new Map(saleServices.map((service) => [service.id, service])),
    [saleServices]
  )

  // Calcule les totaux à partir des prix exposés par les services.
  const theoreticalAmount = useMemo(
    () => getSaleTheoreticalAmount(lines, serviceById, currency),
    [currency, lines, serviceById]
  )

  // Calcule le montant à payer effectif, en tenant compte d'un montant personnalisé si l'utilisateur l'a saisi.
  const effectivePayableAmount = hasCustomPayableAmount
    ? normalizeSalePayableAmount(payableAmount, theoreticalAmount)
    : theoreticalAmount

  // Calcule la remise à partir du montant à payer et du montant théorique.
  const discountAmount = getSaleDiscountAmountFromPayableAmount(
    theoreticalAmount,
    effectivePayableAmount
  )
  const totalAmount = effectivePayableAmount
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

  // Quantité déjà au ticket pour chaque service, affichée en badge sur la grille
  const quantityByServiceId = useMemo(() => {
    const quantities = new Map<string, number>()

    lines.forEach((line) => {
      quantities.set(
        line.productServiceId,
        (quantities.get(line.productServiceId) ?? 0) + line.quantity
      )
    })

    return quantities
  }, [lines])

  /**
   * Ajoute un service au ticket : une ligne existante du même service gagne une unité.
   */
  const pickService = (serviceId: string) => {
    // L'ajout se voit tout de suite : on revient sur les lignes si le paiement était ouvert
    setTicketTab('lines')
    setLines((current) => {
      const existingIndex = current.findIndex((line) => line.productServiceId === serviceId)

      if (existingIndex === -1) {
        return [...current, { ...EMPTY_SALE_LINE, productServiceId: serviceId }]
      }

      return current.map((line, index) =>
        index === existingIndex ? { ...line, quantity: line.quantity + 1 } : line
      )
    })
  }

  /**
   * Met à jour une ligne de service.
   */
  const updateLine = (index: number, patch: Partial<SaleLineState>) => {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    )
  }

  /**
   * Retire une ligne de service du ticket.
   */
  const removeLine = (index: number) => {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
  }

  /**
   * Met à jour le montant à payer saisi, borné au montant théorique.
   */
  const changePayableAmount = (value: number) => {
    setHasCustomPayableAmount(true)
    setPayableAmount(normalizeSalePayableAmount(value, theoreticalAmount))
  }

  /**
   * Remet le formulaire à zéro après une vente enregistrée.
   */
  const resetForm = () => {
    setPaymentType('CASH')
    setPaymentMethod('CASH')
    setPaymentReference('')
    setCustomerId('')
    setPayableAmount(0)
    setHasCustomPayableAmount(false)
    setLines([])
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

    const payload = buildCreateSalePayload({
      paymentType,
      paymentMethod,
      paymentReference,
      customerId,
      operatorId,
      currency,
      payableAmount: effectivePayableAmount,
      theoreticalAmount,
      lines,
    })

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
        },
      }
    )
  }

  return (
    <main
      ref={pageRef}
      style={{ '--sale-page-height': pageHeight } as CSSProperties}
      className="flex min-h-screen flex-col bg-muted/40 text-foreground lg:h-(--sale-page-height) lg:min-h-0 lg:overflow-hidden"
    >
      <div className="fixed left-[10000px] top-0" aria-hidden="true">
        {/* Le ticket reste monté hors écran pour que react-to-print puisse le lire via ref. */}
        <div ref={receiptRef} className="bg-white">
          {printSale && <ThermalSaleReceipt sale={printSale} />}
        </div>
      </div>

      <section className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col gap-4 px-6 py-5 lg:px-10">
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

        {!currentCashSession ? (
          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
              <Banknote className="size-5" />
              Ouvrez une session de caisse avant d&apos;enregistrer une vente.
            </CardContent>
          </Card>
        ) : (
          // Sur grand écran, la grille occupe la hauteur restante et chaque colonne défile seule
          <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_480px]">
            <SaleServiceGrid
              services={saleServices}
              currency={currency}
              quantityByServiceId={quantityByServiceId}
              onPick={pickService}
            />

            <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:min-h-0">
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
                  {lines.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Touchez un service pour l&apos;ajouter au ticket.
                    </p>
                  ) : (
                    lines.map((line, index) => (
                      <SaleTicketLine
                        key={line.productServiceId}
                        line={line}
                        service={getSaleLineService(line, serviceById)}
                        currency={currency}
                        onChange={(patch) => updateLine(index, patch)}
                        onRemove={() => removeLine(index)}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="payment" className="min-h-0 overflow-y-auto">
                  <SaleTicketFields
                    paymentType={paymentType}
                    onPaymentTypeChange={setPaymentType}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    paymentReference={paymentReference}
                    onPaymentReferenceChange={setPaymentReference}
                    currency={currency}
                    onCurrencyChange={setCurrency}
                    operatorId={operatorId}
                    onOperatorChange={setOperatorId}
                    customerId={customerId}
                    onCustomerChange={setCustomerId}
                    operators={operators}
                    customers={customers}
                    operatorMissing={operatorMissing}
                    customerMissing={customerMissing}
                  />
                </TabsContent>
              </Tabs>

              {/* Le résumé reste sous les onglets, toujours visible */}
              <SaleTicketSummary
                currency={currency}
                theoreticalAmount={theoreticalAmount}
                payableAmount={effectivePayableAmount}
                onPayableAmountChange={changePayableAmount}
                discountAmount={discountAmount}
                totalAmount={totalAmount}
                // Le bouton reste actif malgré un champ manquant : il ouvre alors l'onglet Paiement
                canSubmit={lines.length > 0}
                isSubmitting={isSubmitting}
                onSubmit={submitSale}
              />
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}
