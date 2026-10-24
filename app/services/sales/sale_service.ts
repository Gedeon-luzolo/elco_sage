import { CashSessionStatus } from '#models/cash_session'
import { JournalisationModule } from '#models/journalisation'
import Sale, { SaleStatus } from '#models/sale'
import type User from '#models/user'
import { CacheKeys } from '#services/cache/cache_keys'
import CacheService from '#services/cache/cache_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import AdditionNumberService from '#services/sales/addition_number_service'
import SaleItemService from '#services/sales/sale_item_service'
import SaleValidationService from '#services/sales/sale_validation_service'
import type { CreateSaleInput, FindSalesHistoryParams } from '#types/sales'
import { dateKeyToDay, dateTimeToDateKey } from '#utils/date_utils'
import { paginateBatch } from '#utils/paginated_batch'
import { findReplayedRecord } from '#utils/idempotency'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

// Nombre maximum de ventes renvoyées par lot pour l'historique.
const SALES_HISTORY_MAX_BATCH = 40

@inject()
export default class SaleService {
  constructor(
    private journalisationService: JournalisationService,
    private saleItemService: SaleItemService,
    private saleValidationService: SaleValidationService,
    private cacheService: CacheService,
    private additionNumberService: AdditionNumberService
  ) {}

  /**
   * Récupère l'historique des ventes par lot, toutes caisses et tous statuts confondus.
   * Permet de retrouver une addition passée pour la réimprimer.
   */
  async findAllBatch({
    offset,
    limit,
    facturationDate,
    additionNumber,
    status,
  }: FindSalesHistoryParams = {}) {
    const query = Sale.query()

    // Applique le filtre de date de facturation si précisé.
    if (facturationDate) {
      const dayStart = dateKeyToDay(facturationDate).toJSDate()
      const dayEnd = dateKeyToDay(facturationDate).endOf('day').toJSDate()

      query.whereBetween('saleDate', [dayStart, dayEnd])
    }

    // Recherche partielle et insensible à la casse sur le numéro d'addition.
    if (additionNumber) {
      query.whereILike('additionNumber', `%${additionNumber}%`)
    }

    // Filtre par statut (active/annulée) si précisé.
    if (status) {
      query.where('status', status)
    }

    // Le total est compté sur les filtres, puis les relations et le tri sont ajoutés au lot
    return paginateBatch(
      query,
      { offset, limit, maxLimit: SALES_HISTORY_MAX_BATCH, defaultLimit: SALES_HISTORY_MAX_BATCH },
      (batchQuery) =>
        batchQuery
          .preload('cashSession')
          .preload('customer')
          .preload('operator')
          .preload('seller')
          .preload('items', (itemsQuery) => {
            itemsQuery.preload('productService')
          })
          .preload('recoveries')
          .orderBy('saleDate', 'desc')
    )
  }

  /**
   * Cree une vente et ses lignes dans une transaction.
   */
  async create(actor: User, payload: CreateSaleInput) {
    // Un rejeu (client hors ligne qui resynchronise) ne recrée rien : on renvoie la vente existante.
    const replayed = await findReplayedRecord({
      id: payload.id,
      find: (id) => Sale.find(id),
      belongsToCaller: (sale) => sale.sellerId === actor.id,
      conflictMessage: 'Cet identifiant de vente est déjà utilisé.',
    })

    if (replayed) {
      return this.findById(replayed.id)
    }

    // Les lignes sont préparées avant la transaction pour valider les services et calculer les prix.
    const prepared = await this.saleItemService.prepareItems(payload.items, payload.currency)
    const discountAmount = Number(payload.discountAmount ?? 0)
    const theoreticalAmount = prepared.theoreticalAmount
    const totalAmount = theoreticalAmount - discountAmount
    // La date de vente garde l'heure réelle ou celle envoyée par le formulaire.
    const saleDate = this.resolveSaleDate(payload.saleDate)

    const cashSession = await this.saleValidationService.validateCreateSale({
      actor,
      payload,
      theoreticalAmount,
      discountAmount,
    })
    // Les sorties stock suivent la date métier de la caisse, pas forcément la date système.
    const stockDateKey = dateTimeToDateKey(cashSession.openedAt)

    const createdSale = await db.transaction(async (trx) => {
      // Le client fournit un numéro issu de la plage réservée à sa caisse ;
      // sans numéro, le serveur en attribue un (verrouillé dans la transaction)
      let additionNumber: string
      if (payload.additionNumber) {
        await this.additionNumberService.assertReservedFor(
          cashSession.id,
          actor.id,
          payload.additionNumber,
          trx
        )
        additionNumber = this.additionNumberService.format(Number(payload.additionNumber))
      } else {
        additionNumber = await this.additionNumberService.generateOnlineNumber(trx)
      }

      // L'entete porte les informations communes a toutes les lignes de vente.
      const sale = await Sale.create(
        {
          id: payload.id,
          cashSessionId: cashSession.id,
          customerId: payload.customerId ?? null,
          operatorId: payload.operatorId,
          sellerId: actor.id,
          paymentType: payload.paymentType,
          additionNumber,
          saleDate,
          currency: payload.currency,
          theoreticalAmount,
          discountAmount,
          totalAmount,
          status: SaleStatus.ACTIVE,
        },
        { client: trx }
      )

      // Les sorties de stock sont imputées dans la même transaction que la vente.
      // Si le stock échoue, l'entête de vente et les lignes sont rollback ensemble.
      await this.saleItemService.consumeStockForSale(prepared.items, stockDateKey, trx)

      // Les lignes gardent seulement l'id du service et les montants calculés.
      await this.saleItemService.createManyForSale(sale.id, prepared.items, trx)

      await this.journalisationService.create({
        module: JournalisationModule.SALES,
        message: `Addition ${sale.additionNumber} creee par ${actor.fullName ?? actor.email}.`,
        user: actor,
      })

      await sale.load('items', (itemsQuery) => {
        itemsQuery.preload('productService')
      })

      return sale
    })

    this.invalidateSaleDomains()

    return createdSale
  }

  /**
   * Annule une vente sans la supprimer.
   */
  async cancel(actor: User, id: string) {
    const sale = await db.transaction(async (trx) => {
      // On recharge les lignes avec les produits consommés pour pouvoir restituer le stock.
      const item = await Sale.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('productService', (serviceQuery) => {
            serviceQuery.preload('stockProduct')
          })
        })
        .preload('cashSession')
        .firstOrFail()

      // Si la vente est déjà annulée, on ne fait rien et on retourne l'objet.
      if (item.status === SaleStatus.CANCELLED) {
        return item
      }

      // Une fois la caisse fermée, l'addition est figée dans le rapport de clôture.
      if (item.cashSession.status === CashSessionStatus.CLOSED) {
        throw new Error("Impossible d'annuler une vente dont la session de caisse est fermée.")
      }

      // L'annulation retire les sorties de stock associées aux services vendus.
      await this.saleItemService.restoreStockForCancelledSale(
        item.items.map((saleItem) => {
          // Les anciennes ventes doivent rester annulables seulement si leur service est encore correctement lié.
          if (!saleItem.productService?.stockProduct) {
            throw new Error(
              `Le service de la ligne "${saleItem.orderNumber}" n'est pas lié à un produit de stock.`
            )
          }

          return {
            orderNumber: saleItem.orderNumber,
            productServiceId: saleItem.productServiceId,
            stockProduct: saleItem.productService.stockProduct,
            quantity: saleItem.quantity,
            currency: saleItem.currency,
            unitPrice: saleItem.unitPrice,
            totalPrice: saleItem.totalPrice,
          }
        }),
        // La restitution utilise la même date métier de caisse que la création de vente.
        dateTimeToDateKey(item.cashSession.openedAt),
        trx
      )

      // Une annulation conserve l'historique et retire la vente des totaux actifs.
      item.status = SaleStatus.CANCELLED
      await item.useTransaction(trx).save()

      return item
    })

    await this.journalisationService.create({
      module: JournalisationModule.SALES,
      message: `Addition ${sale.additionNumber} annulée par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    this.invalidateSaleDomains()

    return sale
  }

  // Invalide les domaines impactés par une vente: finances, caisse et stock consommable.
  private invalidateSaleDomains() {
    this.cacheService.forgetByPrefix(CacheKeys.sales.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.debts.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.recoveries.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.cashSessions.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.stock.prefix)
    this.cacheService.forgetByPrefix(CacheKeys.productServices.activeForSalePrefix)
  }

  /**
   * Charge une vente avec toutes ses relations utiles.
   */
  async findById(id: string) {
    return Sale.query()
      .where('id', id)
      .preload('cashSession')
      .preload('customer')
      .preload('operator')
      .preload('seller')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('productService')
      })
      .preload('recoveries')
      .firstOrFail()
  }

  // Convertit la date reçue en DateTime, ou utilise l'heure serveur par défaut.
  private resolveSaleDate(saleDate?: string | Date | null) {
    if (!saleDate) {
      return DateTime.now()
    }

    if (saleDate instanceof Date) {
      return DateTime.fromJSDate(saleDate)
    }

    return DateTime.fromISO(saleDate)
  }
}
