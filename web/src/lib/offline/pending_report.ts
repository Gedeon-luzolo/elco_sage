import type { OutboxEntry } from '~/lib/offline/db'
import type { SaleReportTotals } from '~/types/cash_session_types'
import type { SaleItemRow } from '~/types/sale_types'
import type { MoneyMap } from '~/utils/money_map.utils'

// Session de caisse concernée par le rapport : seuls ces champs servent à retrouver ses opérations.
type ReportSession = { id: string; userId: string; status: string }

// Opérations de la session encore dans la file : les ventes locales et les montants encaissés.
export interface PendingActivity {
  sales: SaleItemRow[]
  recoveries: Array<{ amount: number; currency: string }>
}

// Totaux à zéro, pour une session dont le rapport du serveur n'est pas encore disponible.
export const EMPTY_REPORT_TOTALS: SaleReportTotals = {
  theoreticalAmounts: {},
  discountAmounts: {},
  cashAmounts: {},
  debtAmounts: {},
  realAmounts: {},
  recoveryAmounts: {},
  collectionAmounts: {},
}

// Ajoute un montant à une map par devise, sans modifier la map d'origine.
function addAmount(map: MoneyMap, currency: string, amount: number): MoneyMap {
  return { ...map, [currency]: (map[currency] ?? 0) + amount }
}

// Retrouve les opérations en attente qui appartiennent à la session affichée.
export function getPendingActivity(
  entries: OutboxEntry[],
  session: ReportSession | null | undefined
): PendingActivity {
  const activity: PendingActivity = { sales: [], recoveries: [] }

  if (!session) return activity

  for (const entry of entries) {
    // Une opération refusée par le serveur n'est pas comptée : elle n'existera jamais
    if (entry.status !== 'pending') continue

    // Une vente est rattachée à la session qui a servi à la créer
    if (entry.type === 'sale' && entry.sale?.cashSessionId === session.id) {
      activity.sales.push(entry.sale)
    }

    // Un recouvrement est rattaché par le serveur à la session ouverte de son auteur
    if (entry.type === 'recovery' && session.status === 'OPEN' && entry.userId === session.userId) {
      activity.recoveries.push({
        amount: Number(entry.body.amount),
        currency: String(entry.body.currency),
      })
    }
  }

  return activity
}

// Nombre d'opérations en attente qui s'ajoutent au rapport.
export function countPendingActivity(activity: PendingActivity) {
  return activity.sales.length + activity.recoveries.length
}

// Ajoute les ventes et recouvrements en attente aux totaux du serveur, avec les mêmes règles :
// le théorique et la remise comptent toutes les ventes, le cash et les dettes selon le paiement,
// le revenu réel est cash + dettes et l'encaissement est cash + recouvrements.
export function mergePendingTotals(
  totals: SaleReportTotals,
  activity: PendingActivity
): SaleReportTotals {
  const merged = { ...totals }

  for (const sale of activity.sales) {
    merged.theoreticalAmounts = addAmount(
      merged.theoreticalAmounts,
      sale.currency,
      sale.theoreticalAmount
    )
    merged.discountAmounts = addAmount(merged.discountAmounts, sale.currency, sale.discountAmount)

    // Une vente cash entre en caisse, une vente à crédit devient une dette
    if (sale.paymentType === 'CASH') {
      merged.cashAmounts = addAmount(merged.cashAmounts, sale.currency, sale.totalAmount)
      merged.realAmounts = addAmount(merged.realAmounts, sale.currency, sale.totalAmount)
      merged.collectionAmounts = addAmount(
        merged.collectionAmounts,
        sale.currency,
        sale.totalAmount
      )
    }

    if (sale.paymentType === 'CREDIT') {
      merged.debtAmounts = addAmount(merged.debtAmounts, sale.currency, sale.totalAmount)
      merged.realAmounts = addAmount(merged.realAmounts, sale.currency, sale.totalAmount)
    }
  }

  // Un recouvrement est de l'argent encaissé en plus
  for (const recovery of activity.recoveries) {
    merged.recoveryAmounts = addAmount(merged.recoveryAmounts, recovery.currency, recovery.amount)
    merged.collectionAmounts = addAmount(
      merged.collectionAmounts,
      recovery.currency,
      recovery.amount
    )
  }

  return merged
}
