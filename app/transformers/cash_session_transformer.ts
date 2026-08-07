import type CashSession from '#models/cash_session'
import type { CashSessionSystemAmounts } from '#services/sales/cash_session_service'
import { MoneyMapDTO, normalizeMoneyMap } from '#utils/money_map'
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
  systemAmounts: MoneyMapDTO
  closingAmounts: MoneyMapDTO | null
  differenceAmounts: MoneyMapDTO | null
  userName: string | null
  userRole: string | null
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
      userId: item.userId,
      status: item.status,
      openedAt: item.openedAt?.toISO() ?? null,
      openingDate: item.openedAt?.toISODate() ?? null,
      openingTime: item.openedAt?.toFormat('HH:mm') ?? null,
      closedAt: item.closedAt?.toISO() ?? null,
      closingDate: item.closedAt?.toISODate() ?? null,
      closingTime: item.closedAt?.toFormat('HH:mm') ?? null,
      systemAmounts: normalizeMoneyMap(systemAmounts?.systemAmounts ?? item.systemAmounts),
      closingAmounts: item.closingAmounts ? normalizeMoneyMap(item.closingAmounts) : null,
      differenceAmounts: item.differenceAmounts ? normalizeMoneyMap(item.differenceAmounts) : null,
      userName: item.user?.fullName ?? null,
      userRole: item.user?.role ?? null,
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
