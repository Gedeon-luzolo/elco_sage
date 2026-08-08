import { router } from '@inertiajs/react'
import {
  ArrowLeft,
  Banknote,
  Minus,
  Plus,
  ReceiptText,
  Save,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '~/components/common/page_header'
import { SaleSummaryLine } from '~/components/sales/sale_summary_line'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { InertiaProps } from '~/types'
import type { SaleCreatePageProps } from '~/types/cash_session_types'
import { CURRENCY_OPTIONS, Currency, type CurrencyCode } from '~/utils/currency'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import {
  buildCreateSalePayload,
  canSubmitSaleForm,
  EMPTY_SALE_LINE,
  getSaleDiscountAmountFromPayableAmount,
  getSaleLineService,
  getSaleLineStockMessage,
  getSaleLineTotal,
  getSaleTheoreticalAmount,
  hasSaleLineStockIssue,
  hasSaleStockIssue,
  normalizeSalePayableAmount,
  SALE_PAYMENT_OPTIONS,
  type SaleLineState,
  type SalePaymentType,
} from '~/utils/sales/sale.utils'

export default function SaleCreatePage({
  currentCashSession,
  saleServices,
  operators,
  customers,
}: InertiaProps<SaleCreatePageProps>) {
  const [paymentType, setPaymentType] = useState<SalePaymentType>('CASH')
  const [currency, setCurrency] = useState<CurrencyCode>(Currency.CDF)
  const [operatorId, setOperatorId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [payableAmount, setPayableAmount] = useState(0)
  const [hasCustomPayableAmount, setHasCustomPayableAmount] = useState(false)
  const [lines, setLines] = useState<SaleLineState[]>([EMPTY_SALE_LINE])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const serviceById = useMemo(
    () => new Map(saleServices.map((service) => [service.id, service])),
    [saleServices]
  )

  // Calcule les totaux a partir des prix exposes par les services.
  const theoreticalAmount = useMemo(
    () => getSaleTheoreticalAmount(lines, serviceById, currency),
    [currency, lines, serviceById]
  )

  // Calcule le montant a payer effectif, en tenant compte d'un montant personnalise si l'utilisateur l'a saisi.
  const effectivePayableAmount = hasCustomPayableAmount
    ? normalizeSalePayableAmount(payableAmount, theoreticalAmount)
    : theoreticalAmount

  // Calcule la remise a partir du montant a payer et du montant theorique.
  const discountAmount = getSaleDiscountAmountFromPayableAmount(
    theoreticalAmount,
    effectivePayableAmount
  )
  const totalAmount = effectivePayableAmount
  const hasStockIssue = hasSaleStockIssue(lines, serviceById)
  // Verifie si le formulaire peut etre soumis, en tenant compte des champs requis et des problemes de stock.
  const canSubmit =
    canSubmitSaleForm({
      currentCashSessionId: currentCashSession?.id,
      paymentType,
      operatorId,
      customerId,
      discountAmount,
      lines,
    }) && !hasStockIssue

  /**
   * Ajoute une ligne de service au formulaire.
   */
  const addLine = () => {
    setLines((current) => [...current, EMPTY_SALE_LINE])
  }

  /**
   * Met a jour une ligne de service.
   */
  const updateLine = (index: number, patch: Partial<SaleLineState>) => {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    )
  }

  /**
   * Retire une ligne de service du formulaire.
   */
  const removeLine = (index: number) => {
    setLines((current) => {
      if (current.length === 1) {
        return [EMPTY_SALE_LINE]
      }

      return current.filter((_, lineIndex) => lineIndex !== index)
    })
  }

  /**
   * Enregistre la vente via le backend.
   */
  const submitSale = () => {
    if (!canSubmit) return

    setIsSubmitting(true)

    router.post(
      '/sales',
      buildCreateSalePayload({
        paymentType,
        customerId,
        operatorId,
        currency,
        payableAmount: effectivePayableAmount,
        theoreticalAmount,
        lines,
      }),
      {
        onFinish: () => setIsSubmitting(false),
      }
    )
  }

  return (
    <main className="min-h-screen bg-muted/40 text-foreground">
      <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8 lg:px-10">
        <PageHeader
          title="Nouvelle vente"
          description="Enregistrer une vente de services dans la session de caisse courante."
          icon={ShoppingCart}
        >
          <Button type="button" variant="outline" onClick={() => router.visit('/sales')}>
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
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="space-y-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Informations de vente</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sale-payment-type">Paiement</Label>
                    <Select
                      id="sale-payment-type"
                      items={SALE_PAYMENT_OPTIONS}
                      value={paymentType}
                      onValueChange={(value) => setPaymentType(value as SalePaymentType)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALE_PAYMENT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sale-currency">Devise</Label>
                    <Select
                      id="sale-currency"
                      items={CURRENCY_OPTIONS}
                      value={currency}
                      onValueChange={(value) => setCurrency(value as CurrencyCode)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sale-operator">Operateur</Label>
                    <Select
                      id="sale-operator"
                      items={operators.map((operator) => ({
                        label: operator.fullName ?? operator.email,
                        value: operator.id,
                      }))}
                      value={operatorId}
                      onValueChange={(value) => setOperatorId(value ?? '')}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Selectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator.id} value={operator.id}>
                            {operator.fullName ?? operator.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sale-customer">Client</Label>
                    <Select
                      id="sale-customer"
                      items={customers.map((customer) => ({
                        label: customer.fullName,
                        value: customer.id,
                      }))}
                      value={customerId}
                      onValueChange={(value) => setCustomerId(value ?? '')}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Selectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="space-y-3">
                  {lines.map((line, index) => {
                    const selectedService = getSaleLineService(line, serviceById)
                    const lineTotal = getSaleLineTotal(line, serviceById, currency)
                    const stockMessage = getSaleLineStockMessage(line, serviceById)
                    const hasLineStockIssue = hasSaleLineStockIssue(line, serviceById)

                    return (
                      <div
                        key={index}
                        className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3 lg:grid-cols-[160px_1fr_160px_140px_44px_44px]"
                      >
                        <div className="grid gap-2">
                          <Label>Bon</Label>
                          <Input
                            value={line.orderNumber}
                            onChange={(event) =>
                              updateLine(index, { orderNumber: event.target.value })
                            }
                            placeholder="BC-001"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Service</Label>
                          <Select
                            items={saleServices.map((item) => ({
                              label:
                                item.saleAvailableStock === null
                                  ? item.name
                                  : `${item.name} - ${item.saleAvailableStock} ${item.stockProductBaseUnit ?? ''}`,
                              value: item.id,
                            }))}
                            value={line.productServiceId}
                            onValueChange={(value) =>
                              updateLine(index, { productServiceId: value ?? '' })
                            }
                          >
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Selectionner un service..." />
                            </SelectTrigger>
                            <SelectContent>
                              {saleServices.map((item) => (
                                <SelectItem key={item.id} value={item.id} disabled={!item.canSell}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {stockMessage && (
                            <p
                              className={`text-xs ${
                                hasLineStockIssue
                                  ? 'text-destructive'
                                  : 'text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {stockMessage}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label>Quantite</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                updateLine(index, { quantity: Math.max(line.quantity - 1, 1) })
                              }
                            >
                              <Minus className="size-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={selectedService?.saleAvailableStock ?? undefined}
                              step="1"
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(index, { quantity: Number(event.target.value) })
                              }
                              className="text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateLine(index, { quantity: line.quantity + 1 })}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label>Total ligne</Label>
                          <div className="flex h-10 items-center justify-end rounded-xl border border-border bg-background px-3 text-sm font-semibold">
                            {formatMoneyWithCurrency(lineTotal, currency)}
                          </div>
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeLine(index)}
                            title="Retirer la ligne"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addLine}
                            title="Ajouter une ligne"
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </section>

            <aside className="h-fit rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="size-5" />
                  <h2 className="font-semibold">Resume</h2>
                </div>
              </div>

              <div className="space-y-4 p-4">
                <SaleSummaryLine
                  label="Montant theorique"
                  value={formatMoneyWithCurrency(theoreticalAmount, currency)}
                />

                <div className="grid gap-2">
                  <Label htmlFor="sale-payable-amount">Montant a payer</Label>
                  <Input
                    id="sale-payable-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={effectivePayableAmount}
                    onChange={(event) => {
                      setHasCustomPayableAmount(true)
                      setPayableAmount(
                        normalizeSalePayableAmount(Number(event.target.value), theoreticalAmount)
                      )
                    }}
                  />
                </div>

                <SaleSummaryLine
                  label="Remise calculee"
                  value={formatMoneyWithCurrency(discountAmount, currency)}
                />

                <SaleSummaryLine
                  label="Total a payer"
                  value={formatMoneyWithCurrency(totalAmount, currency)}
                  strong
                />

                <Button
                  type="button"
                  className="h-11 w-full"
                  disabled={!canSubmit || isSubmitting}
                  onClick={submitSale}
                >
                  <Save className="size-4" />
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer la vente'}
                </Button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}
