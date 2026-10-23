import type { OutboxEntry } from '~/lib/offline/db'
import { getPendingEntries } from '~/lib/offline/pending_entries'
import type { SaleItemRow } from '~/types/sale_types'
import { businessDateKey } from '~/utils/date'

// Filtres de l'historique des ventes, les mêmes que ceux envoyés au serveur.
export interface SalesHistoryFilters {
  facturationDate?: string
  additionNumber?: string
  status: string
}

// Ventes faites hors ligne par l'utilisateur et pas encore envoyées, filtrées comme le serveur
// filtre l'historique, de la plus récente à la plus ancienne.
export function getPendingSales(
  entries: OutboxEntry[],
  userId: string,
  filters: SalesHistoryFilters
): SaleItemRow[] {
  // Une vente en file est toujours active : elle ne peut pas correspondre au filtre "annulées"
  if (filters.status === 'CANCELLED') return []

  const search = filters.additionNumber?.toLowerCase()

  return getPendingEntries(entries, 'sale')
    .filter((entry) => entry.userId === userId)
    .flatMap((entry) => (entry.sale ? [entry.sale] : []))
    .filter((sale) => {
      // Recherche partielle sur le numéro d'addition, sans tenir compte de la casse
      if (search && !sale.additionNumber.toLowerCase().includes(search)) return false

      // Filtre sur le jour de facturation, dans le fuseau métier
      if (filters.facturationDate && sale.saleDate) {
        return businessDateKey(sale.saleDate) === filters.facturationDate
      }

      return true
    })
    .sort((a, b) => String(b.saleDate).localeCompare(String(a.saleDate)))
}
