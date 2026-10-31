import { useMemo, useState } from 'react'
import type { ProductServiceDTO } from '~/types/dto'
import type { CurrencyCode } from '~/utils/currency'
import {
  getSaleDiscountAmountFromPayableAmount,
  getSaleTheoreticalAmount,
  normalizeSalePayableAmount,
  type SaleLineState,
} from '~/utils/sales/sale.utils'

interface UseTicketLinesOptions<Line extends SaleLineState> {
  services: ProductServiceDTO[]
  currency: CurrencyCode
  createLine: (serviceId: string) => Line
  initialLines?: Line[]
  initialPayableAmount?: number
}

// Contenu de départ d'un ticket remis à zéro ou prérempli.
interface TicketContent<Line> {
  lines: Line[]
  payableAmount?: number
}

/**
 * Lignes d'un ticket (vente ou proforma) et leurs montants : ajout depuis la grille,
 * modification, retrait, montant à payer saisi et remise qui en découle.
 */
export function useTicketLines<Line extends SaleLineState>({
  services,
  currency,
  createLine,
  initialLines = [],
  initialPayableAmount,
}: UseTicketLinesOptions<Line>) {
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [payableAmount, setPayableAmount] = useState(initialPayableAmount ?? 0)
  const [hasCustomPayableAmount, setHasCustomPayableAmount] = useState(
    initialPayableAmount !== undefined
  )

  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services]
  )

  // Totaux calculés sur les prix du catalogue, comme le fera le serveur
  const theoreticalAmount = useMemo(
    () => getSaleTheoreticalAmount(lines, serviceById, currency),
    [currency, lines, serviceById]
  )

  // Sans saisie, le client paie le total ; une saisie est bornée au total
  const effectivePayableAmount = hasCustomPayableAmount
    ? normalizeSalePayableAmount(payableAmount, theoreticalAmount)
    : theoreticalAmount

  // La remise est la différence entre le total théorique et le montant à payer
  const discountAmount = getSaleDiscountAmountFromPayableAmount(
    theoreticalAmount,
    effectivePayableAmount
  )

  // Quantité déjà au ticket pour chaque service, affichée en badge sur la grille
  const quantityByServiceId = useMemo(
    () => new Map(lines.map((line) => [line.productServiceId, line.quantity])),
    [lines]
  )

  /**
   * Ajoute un service : une ligne existante du même service gagne une unité.
   */
  const pickService = (serviceId: string) => {
    setLines((current) => {
      const existingIndex = current.findIndex((line) => line.productServiceId === serviceId)

      if (existingIndex === -1) {
        return [...current, createLine(serviceId)]
      }

      return current.map((line, index) =>
        index === existingIndex ? { ...line, quantity: line.quantity + 1 } : line
      )
    })
  }

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    )
  }

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
   * Remplace tout le ticket : vide par défaut, ou prérempli (ex : depuis une proforma).
   */
  const resetTicket = ({ lines: nextLines, payableAmount: nextPayable }: TicketContent<Line>) => {
    setLines(nextLines)
    setPayableAmount(nextPayable ?? 0)
    setHasCustomPayableAmount(nextPayable !== undefined)
  }

  return {
    lines,
    serviceById,
    quantityByServiceId,
    theoreticalAmount,
    payableAmount: effectivePayableAmount,
    discountAmount,
    pickService,
    updateLine,
    removeLine,
    changePayableAmount,
    resetTicket,
  }
}
