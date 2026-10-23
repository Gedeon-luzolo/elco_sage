import type { OutboxEntry } from '~/lib/offline/db'
import type { ProductServiceDTO } from '~/types/dto'

// Retire des stocks affichés les quantités des ventes encore dans la file.
// Le serveur ne les connaît pas encore : sans ce calcul, une vente hors ligne
// ne diminuerait pas le stock vendable et on pourrait vendre deux fois la même unité.
export function applyPendingSales<T extends ProductServiceDTO>(
  services: T[],
  entries: OutboxEntry[]
): T[] {
  const consumedByProduct = new Map<string, number>()
  const stockProductByService = new Map(services.map((item) => [item.id, item.stockProductId]))

  for (const entry of entries) {
    // Un conflit a été refusé par le serveur : il ne consomme plus de stock
    if (entry.type !== 'sale' || entry.status !== 'pending') continue

    for (const item of entry.sale?.items ?? []) {
      const stockProductId = stockProductByService.get(item.productServiceId)
      if (!stockProductId) continue

      // Plusieurs services peuvent consommer le même produit en stock
      consumedByProduct.set(
        stockProductId,
        (consumedByProduct.get(stockProductId) ?? 0) + Number(item.quantity)
      )
    }
  }

  // Rien en attente : on rend la même liste pour éviter des rendus inutiles
  if (consumedByProduct.size === 0) return services

  return services.map((service) => {
    const consumed = service.stockProductId ? consumedByProduct.get(service.stockProductId) : 0

    // Les services sans suivi de stock ne sont pas touchés
    if (!consumed || service.saleAvailableStock === null) return service

    // Le stock affiché ne descend jamais sous zéro
    const available = Math.max(0, service.saleAvailableStock - consumed)

    return { ...service, saleAvailableStock: available, canSell: service.canSell && available > 0 }
  })
}
