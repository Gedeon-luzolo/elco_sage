import type { OutboxEntry } from '~/lib/offline/db'
import { getPendingEntries } from '~/lib/offline/pending_entries'
import type { DebtItem, DebtStats } from '~/types/debt_types'
import { addAmount } from '~/utils/money_map.utils'

// Résultat de la liste des dettes une fois les recouvrements en attente déduits.
interface DebtsWithPending {
  debts: DebtItem[]
  stats: DebtStats
}

// Retrouve la vente d'un recouvrement dans le chemin de la requête (/sales/:id/recoveries).
function getRecoverySaleId(entry: OutboxEntry) {
  return entry.path.match(/^\/sales\/([^/]+)\/recoveries$/)?.[1] ?? null
}

// Somme, par vente, les montants recouvrés hors ligne et pas encore envoyés.
function getPendingRecoveredBySale(entries: OutboxEntry[], debts: DebtItem[]) {
  const currencyBySale = new Map(debts.map((debt) => [debt.sale.id, debt.sale.currency]))
  const recoveredBySale = new Map<string, number>()

  for (const entry of getPendingEntries(entries, 'recovery')) {
    const saleId = getRecoverySaleId(entry)
    if (!saleId || !currencyBySale.has(saleId)) continue

    // Comme le serveur, seuls les recouvrements dans la devise de la vente comptent
    if (entry.body.currency !== currencyBySale.get(saleId)) continue

    recoveredBySale.set(saleId, (recoveredBySale.get(saleId) ?? 0) + Number(entry.body.amount))
  }

  return recoveredBySale
}

// Recalcule les statistiques à partir des dettes restantes, avec les mêmes règles que le serveur.
function buildDebtStats(debts: DebtItem[]): DebtStats {
  const stats: DebtStats = {
    totalDebts: debts.length,
    totalDebtAmounts: {},
    recoveredAmounts: {},
    remainingAmounts: {},
  }

  for (const debt of debts) {
    const currency = debt.sale.currency

    stats.totalDebtAmounts = addAmount(stats.totalDebtAmounts, currency, debt.debtTotalAmount)
    stats.recoveredAmounts = addAmount(stats.recoveredAmounts, currency, debt.recoveredAmount)
    stats.remainingAmounts = addAmount(stats.remainingAmounts, currency, debt.remainingAmount)
  }

  return stats
}

// Déduit des dettes affichées les recouvrements encore dans la file.
// Le serveur ne les connaît pas encore : sans ce calcul, une dette encaissée hors ligne
// resterait entière à l'écran et on pourrait l'encaisser deux fois.
export function applyPendingRecoveries(
  debts: DebtItem[],
  stats: DebtStats,
  entries: OutboxEntry[]
): DebtsWithPending {
  const recoveredBySale = getPendingRecoveredBySale(entries, debts)

  // Rien en attente : on rend les mêmes références pour éviter des rendus inutiles
  if (recoveredBySale.size === 0) return { debts, stats }

  const adjusted = debts.flatMap((debt) => {
    const pending = recoveredBySale.get(debt.sale.id)
    if (!pending) return [debt]

    const recoveredAmount = debt.recoveredAmount + pending
    const remainingAmount = Math.max(debt.debtTotalAmount - recoveredAmount, 0)

    // Une dette soldée hors ligne quitte la liste, comme le fait le serveur
    if (remainingAmount === 0) return []

    return [{ ...debt, recoveredAmount, remainingAmount, debtStatus: 'PARTIAL' as const }]
  })

  return { debts: adjusted, stats: buildDebtStats(adjusted) }
}
