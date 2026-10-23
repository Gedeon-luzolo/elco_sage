import { describe, expect, it } from 'vitest'
import type { OutboxEntry } from '~/lib/offline/db'
import { applyPendingSales } from '~/lib/offline/pending_stock'
import type { CustomerDTO, ProductServiceDTO, UserDTO } from '~/types/dto'
import { buildLocalSale } from '~/utils/sales/local_sale'

// Fabrique un service vendable avec son produit en stock et son stock disponible.
const service = (id: string, stockProductId: string | null, stock: number | null, price = 1000) =>
  ({
    id,
    name: `Service ${id}`,
    stockProductId,
    saleAvailableStock: stock,
    canSell: true,
    priceCdf: price,
    priceUsd: 1,
  }) as ProductServiceDTO

// Fabrique une vente en file avec les lignes données.
const saleEntry = (
  items: Array<{ productServiceId: string; quantity: number }>,
  status: OutboxEntry['status'] = 'pending'
) => ({ type: 'sale', status, sale: { items } }) as unknown as OutboxEntry

describe('stock des ventes en attente', () => {
  it('retire les quantités en attente de tous les services du même produit', () => {
    const services = [
      service('a4-nb', 'papier', 10),
      service('a4-couleur', 'papier', 10),
      service('autre', 'encre', 5),
    ]

    const result = applyPendingSales(services, [
      saleEntry([{ productServiceId: 'a4-nb', quantity: 4 }]),
    ])

    expect(result.map((item) => item.saleAvailableStock)).toEqual([6, 6, 5])
  })

  it('bloque la vente quand le stock local tombe à zéro', () => {
    const result = applyPendingSales(
      [service('a', 'papier', 3)],
      [saleEntry([{ productServiceId: 'a', quantity: 3 }])]
    )

    expect(result[0]).toMatchObject({ saleAvailableStock: 0, canSell: false })
  })

  it('ne passe jamais sous zéro et ignore les opérations qui ne sont pas des ventes', () => {
    const result = applyPendingSales(
      [service('a', 'papier', 2)],
      [
        saleEntry([{ productServiceId: 'a', quantity: 9 }]),
        { type: 'recovery', sale: null } as unknown as OutboxEntry,
      ]
    )

    expect(result[0].saleAvailableStock).toBe(0)
  })

  it('ignore les ventes en conflit : le serveur les a refusées', () => {
    const services = [service('a', 'papier', 5)]

    const result = applyPendingSales(services, [
      saleEntry([{ productServiceId: 'a', quantity: 3 }], 'conflict'),
    ])

    expect(result[0].saleAvailableStock).toBe(5)
  })

  it('ne touche pas aux services sans suivi de stock et rend la même liste s’il n’y a rien en attente', () => {
    const services = [service('a', null, null)]

    expect(applyPendingSales(services, [])).toBe(services)
    expect(
      applyPendingSales(services, [saleEntry([{ productServiceId: 'a', quantity: 1 }])])[0]
        .saleAvailableStock
    ).toBeNull()
  })
})

describe('vente locale pour le ticket', () => {
  it('reconstruit les montants, le client et les noms comme le ferait le serveur', () => {
    const sale = buildLocalSale({
      id: 'sale-1',
      additionNumber: '00203',
      saleDate: '2026-10-23T10:00:00.000Z',
      cashSessionId: 'session-1',
      payload: {
        paymentType: 'CREDIT',
        customerId: 'c1',
        operatorId: 'o1',
        currency: 'CDF',
        discountAmount: 500,
        items: [{ orderNumber: '12', productServiceId: 'a', quantity: 3 }],
      },
      services: [service('a', 'papier', 10, 2000)],
      customers: [{ id: 'c1', fullName: 'Client Test' } as CustomerDTO],
      operators: [{ id: 'o1', fullName: 'Op Test' }],
      seller: { id: 'u1', fullName: 'Caissier' } as UserDTO,
    })

    expect(sale).toMatchObject({
      additionNumber: '00203',
      theoreticalAmount: 6000,
      discountAmount: 500,
      totalAmount: 5500,
      customer: { fullName: 'Client Test' },
      operatorName: 'Op Test',
      sellerName: 'Caissier',
      status: 'ACTIVE',
    })
    expect(sale.items[0]).toMatchObject({ quantity: 3, unitPrice: 2000, totalPrice: 6000 })
  })
})
