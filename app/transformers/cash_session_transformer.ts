import type CashSession from '#models/cash_session'
import type { CashSessionSystemAmounts } from '#services/sales/cash_session_service'
import { dateTimeToDateKey, dateTimeToTimeLabel } from '#utils/date_utils'
import { MoneyMapDTO, normalizeMoneyMap } from '#utils/money_map'
import type { JSONDataTypes } from '@adonisjs/core/types/transformers'

export interface CashSessionDTO extends Record<string, JSONDataTypes> {
  id: string
  openedById: string
  closedById: string | null
  status: string
  openedAt: string | null
  openingDate: string | null
  openingTime: string | null
  closedAt: string | null
  closingDate: string | null
  closingTime: string | null
  systemAmounts: MoneyMapDTO
  closingAmounts: MoneyMapDTO | null
  differenceAmounts: MoneyMapDTO | null
  openedByName: string | null
  closedByName: string | null
}

export default class CashSessionTransformer {
  /**
   * Transforme une session de caisse pour les pages Inertia.
   */
  public static transformSingle(
    item: CashSession,
    systemAmounts?: CashSessionSystemAmounts
  ): CashSessionDTO {
    return {
      id: item.id,
      openedById: item.openedById,
      closedById: item.closedById,
      status: item.status,
      openedAt: item.openedAt?.toISO() ?? null,
      openingDate: item.openedAt ? dateTimeToDateKey(item.openedAt) : null,
      openingTime: item.openedAt ? dateTimeToTimeLabel(item.openedAt) : null,
      closedAt: item.closedAt?.toISO() ?? null,
      closingDate: item.closedAt ? dateTimeToDateKey(item.closedAt) : null,
      closingTime: item.closedAt ? dateTimeToTimeLabel(item.closedAt) : null,
      systemAmounts: normalizeMoneyMap(systemAmounts?.systemAmounts ?? item.systemAmounts),
      closingAmounts: item.closingAmounts ? normalizeMoneyMap(item.closingAmounts) : null,
      differenceAmounts: item.differenceAmounts ? normalizeMoneyMap(item.differenceAmounts) : null,
      openedByName: item.openedBy?.fullName ?? item.openedBy?.email ?? null,
      closedByName: item.closedBy?.fullName ?? item.closedBy?.email ?? null,
    }
  }

  /**
   * Transforme une liste de sessions de caisse.
   */
  public static transform(items: CashSession[]): CashSessionDTO[] {
    return items.map((item) => this.transformSingle(item))
  }

  /**
   * Transforme une session nullable pour simplifier le partage global.
   */
  public static transformNullable(
    item: CashSession | null,
    systemAmounts?: CashSessionSystemAmounts
  ): CashSessionDTO | null {
    return item ? this.transformSingle(item, systemAmounts) : null
  }
}
