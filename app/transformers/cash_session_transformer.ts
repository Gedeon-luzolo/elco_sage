import type CashSession from '#models/cash_session'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

export interface CashSessionDTO extends Record<string, JSONDataTypes> {
  id: string
  userId: string
  status: string
  openedAt: string | null
  openingDate: string | null
  openingTime: string | null
  closedAt: string | null
  closingDate: string | null
  closingTime: string | null
  openingAmount: number
  openingCurrency: string
  closingAmount: number | null
  closingCurrency: string | null
}

export default class CashSessionTransformer {
  /**
   * Transforme une session de caisse pour les pages Inertia.
   */
  public static transformSingle(item: CashSession): CashSessionDTO {
    return {
      id: item.id,
      userId: item.userId,
      status: item.status,
      openedAt: item.openedAt?.toISO() ?? null,
      openingDate: item.openedAt?.toISODate() ?? null,
      openingTime: item.openedAt?.toFormat('HH:mm') ?? null,
      closedAt: item.closedAt?.toISO() ?? null,
      closingDate: item.closedAt?.toISODate() ?? null,
      closingTime: item.closedAt?.toFormat('HH:mm') ?? null,
      openingAmount: item.openingAmount,
      openingCurrency: item.openingCurrency,
      closingAmount: item.closingAmount,
      closingCurrency: item.closingCurrency,
    }
  }

  /**
   * Transforme une session nullable pour simplifier le partage global.
   */
  public static transformNullable(item: CashSession | null): CashSessionDTO | null {
    return item ? this.transformSingle(item) : null
  }
}
