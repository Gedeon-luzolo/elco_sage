import { ArrowLeft, Banknote, ReceiptText, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '~/components/common/page_header'
import { SaleServiceGrid } from '~/components/sales/sale_service_grid'
import { SaleTicketFields } from '~/components/sales/sale_ticket_fields'
import { SaleTicketLine } from '~/components/sales/sale_ticket_line'
import { SaleTicketSummary } from '~/components/sales/sale_ticket_summary'
import { ThermalSaleReceipt } from '~/components/sales/thermal_sale_receipt'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { MODULE_HEADER_ACCENTS } from '~/constants/modules'
import { usePrintInvoice } from '~/hooks/use_print_invoice'
import { useCrud } from '~/hooks/common/useCrud'
import { useAuth } from '~/hooks/auth/useAuth'
import { useCurrentCashSession } from '~/hooks/sales/useCashSession'
import { useCreateSale } from '~/hooks/sales/useCreateSale'
import { buildLocalSale } from '~/utils/sales/local_sale'
import type { CustomerDTO, ProductServiceDTO } from '~/types/dto'
import type { SaleItemRow } from '~/types/sale_types'
import type { UserListItem } from '~/types/user_types'
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

export default function SaleCreatePage() {
  const navigate = useNavigate()
  const { data: currentCashSession } = useCurrentCashSession()

  // Données de référence de la vente
  const { user } = useAuth()
  const { data: saleServices = EMPTY_SERVICES } = useCrud<ProductServiceDTO>({
    endpoint: '/product-services/active-for-sale',
  }).useList()
  const { data: operators = [] } = useCrud<UserListItem>({ endpoint: '/operators' }).useList()
  const { data: customers = [] } = useCrud<CustomerDTO>({
    endpoint: '/customers/active-for-sale',
  }).useList()

  // En ligne la vente part au serveur ; sans réseau elle va dans la file d'attente
  const createSale = useCreateSale()

  // Derniere vente enregistree : son ticket est imprime automatiquement.
  const [printSale, setPrintSale] = useState<SaleItemRow | null>(null)
  const [autoPrintSaleId, setAutoPrintSaleId] = useState<string | null>(null)

  const [paymentType, setPaymentType] = useState<SalePaymentType>('CASH')
  const [currency, setCurrency] = useState<CurrencyCode>(Currency.CDF)
  const [orderNumber, setOrderNumber] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [payableAmount, setPayableAmount] = useState(0)
  const [hasCustomPayableAmount, setHasCustomPayableAmount] = useState(false)
  const [lines, setLines] = useState<SaleLineState[]>([])
  const isSubmitting = createSale.isPending

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
    orderNumber,
    operatorId,
    customerId,
    discountAmount,
    lines,
  })

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
    setOrderNumber('')
    setCustomerId('')
    setPayableAmount(0)
    setHasCustomPayableAmount(false)
    setLines([])
  }

  /**
   * Enregistre la vente via le backend.
   */
  const submitSale = () => {
    if (!canSubmit) return

    if (!currentCashSession || !user) return

    const payload = buildCreateSalePayload({
      paymentType,
      orderNumber,
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
    <main className="min-h-screen bg-muted/40 text-foreground">
      <div className="fixed left-[10000px] top-0" aria-hidden="true">
        {/* Le ticket reste monté hors écran pour que react-to-print puisse le lire via ref. */}
        <div ref={receiptRef} className="bg-white">
          {printSale && <ThermalSaleReceipt sale={printSale} />}
        </div>
      </div>

      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 lg:px-10">
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
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_540px]">
            <SaleServiceGrid
              services={saleServices}
              currency={currency}
              quantityByServiceId={quantityByServiceId}
              onPick={pickService}
            />

            <aside className="rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-6">
              <div className="flex items-center gap-2 border-b border-border p-4">
                <ReceiptText className="size-5" />
                <h2 className="font-semibold">Ticket</h2>
              </div>

              <SaleTicketFields
                orderNumber={orderNumber}
                onOrderNumberChange={setOrderNumber}
                paymentType={paymentType}
                onPaymentTypeChange={setPaymentType}
                currency={currency}
                onCurrencyChange={setCurrency}
                operatorId={operatorId}
                onOperatorChange={setOperatorId}
                customerId={customerId}
                onCustomerChange={setCustomerId}
                operators={operators}
                customers={customers}
              />

              <div className="max-h-[40vh] overflow-y-auto px-4">
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
              </div>

              <SaleTicketSummary
                currency={currency}
                theoreticalAmount={theoreticalAmount}
                payableAmount={effectivePayableAmount}
                onPayableAmountChange={changePayableAmount}
                discountAmount={discountAmount}
                totalAmount={totalAmount}
                canSubmit={canSubmit}
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
