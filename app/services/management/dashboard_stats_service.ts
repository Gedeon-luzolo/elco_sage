import { SalePaymentType } from '#models/sale'
import type Sale from '#models/sale'
import type SaleRecovery from '#models/sale_recovery'
import { Currency } from '#types/currency'
import type {
  DashboardPaymentDistribution,
  DashboardStats,
  DashboardTopService,
} from '#types/dashboard'
import { getDashboardSaleRemainingDebt } from '#utils/dashboard_utils'
import { addMoneyAmount, emptyMoneyMap, normalizeMoneyMap, sumMoneyMaps } from '#utils/money_map'

interface DashboardStatsSource {
  sales: Sale[]
  recoveries: SaleRecovery[]
}

interface TopServiceAccumulator {
  id: string
  name: string
  quantity: number
  amountCdf: number
  amountUsd: number
}

export default class DashboardStatsService {
  /**
   * Calcule les cartes principales du dashboard depuis les données déjà chargées.
   * Les ventes alimentent le chiffre d'affaires et les dettes, les recouvrements alimentent l'encaissement.
   */
  buildStats({ sales, recoveries }: DashboardStatsSource): DashboardStats {
    const theoreticalAmounts = emptyMoneyMap()
    const offeredAmounts = emptyMoneyMap()
    const discountAmounts = emptyMoneyMap()
    const realAmounts = emptyMoneyMap()
    const cashAmounts = emptyMoneyMap()
    const creditAmounts = emptyMoneyMap()
    const recoveryAmounts = emptyMoneyMap()
    const remainingDebtAmounts = emptyMoneyMap()

    let cashSalesCount = 0
    let creditSalesCount = 0
    let offeredSalesCount = 0

    // Une seule boucle sur les ventes suffit pour tous les indicateurs issus des additions.
    for (const sale of sales) {
      addMoneyAmount(theoreticalAmounts, sale.currency, sale.theoreticalAmount)

      if (sale.paymentType === SalePaymentType.CASH) {
        cashSalesCount += 1
        addMoneyAmount(discountAmounts, sale.currency, sale.discountAmount)
        addMoneyAmount(realAmounts, sale.currency, sale.totalAmount)
        addMoneyAmount(cashAmounts, sale.currency, sale.totalAmount)
      }

      if (sale.paymentType === SalePaymentType.CREDIT) {
        creditSalesCount += 1
        addMoneyAmount(discountAmounts, sale.currency, sale.discountAmount)
        addMoneyAmount(realAmounts, sale.currency, sale.totalAmount)
        addMoneyAmount(creditAmounts, sale.currency, sale.totalAmount)
        addMoneyAmount(remainingDebtAmounts, sale.currency, getDashboardSaleRemainingDebt(sale))
      }

      if (sale.paymentType === SalePaymentType.OFFERED) {
        offeredSalesCount += 1
        addMoneyAmount(offeredAmounts, sale.currency, sale.theoreticalAmount)
      }
    }

    // Les recouvrements sont déjà limités à la période par le service parent.
    for (const recovery of recoveries) {
      addMoneyAmount(recoveryAmounts, recovery.currency, recovery.amount)
    }

    return {
      salesCount: sales.length,
      cashSalesCount,
      creditSalesCount,
      offeredSalesCount,
      theoreticalAmounts,
      offeredAmounts,
      realAmounts,
      cashAmounts,
      creditAmounts,
      discountAmounts,
      recoveryAmounts,
      remainingDebtAmounts,
      collectionAmounts: normalizeMoneyMap(sumMoneyMaps(cashAmounts, recoveryAmounts)),
    }
  }

  /**
   * Regroupe les ventes par mode de paiement pour le graphique de répartition.
   */
  buildPaymentDistribution(sales: Sale[]): DashboardPaymentDistribution[] {
    const distribution = new Map<SalePaymentType, DashboardPaymentDistribution>()

    for (const sale of sales) {
      const item = this.getPaymentDistributionItem(distribution, sale.paymentType)

      item.count += 1

      if (sale.currency === Currency.CDF) {
        item.amountCdf += Number(sale.totalAmount || 0)
      }

      if (sale.currency === Currency.USD) {
        item.amountUsd += Number(sale.totalAmount || 0)
      }
    }

    return [...distribution.values()].sort((first, second) => second.count - first.count)
  }

  /**
   * Classe les services les plus vendus depuis les lignes de ventes déjà préchargées.
   */
  buildTopServices(sales: Sale[], limit = 8): DashboardTopService[] {
    const services = new Map<string, TopServiceAccumulator>()

    for (const sale of sales) {
      // Les lignes sont préchargées par DashboardService pour éviter une requête supplémentaire ici.
      for (const item of sale.items ?? []) {
        const service = this.getTopServiceItem(
          services,
          item.productServiceId,
          item.productService?.name ?? 'Service'
        )

        service.quantity += Number(item.quantity || 0)

        if (item.currency === Currency.CDF) {
          service.amountCdf += Number(item.totalPrice || 0)
        }

        if (item.currency === Currency.USD) {
          service.amountUsd += Number(item.totalPrice || 0)
        }
      }
    }

    return [...services.values()]
      .sort(
        (first, second) => second.amountCdf + second.amountUsd - (first.amountCdf + first.amountUsd)
      )
      .slice(0, limit)
  }

  /**
   * Retourne ou initialise la ligne d'un mode de paiement.
   */
  private getPaymentDistributionItem(
    distribution: Map<SalePaymentType, DashboardPaymentDistribution>,
    paymentType: SalePaymentType
  ) {
    if (!distribution.has(paymentType)) {
      distribution.set(paymentType, {
        paymentType,
        count: 0,
        amountCdf: 0,
        amountUsd: 0,
      })
    }

    return distribution.get(paymentType)!
  }

  /**
   * Retourne ou initialise la ligne d'un service vendu.
   */
  private getTopServiceItem(
    services: Map<string, TopServiceAccumulator>,
    id: string,
    name: string
  ) {
    if (!services.has(id)) {
      services.set(id, {
        id,
        name,
        quantity: 0,
        amountCdf: 0,
        amountUsd: 0,
      })
    }

    return services.get(id)!
  }
}
