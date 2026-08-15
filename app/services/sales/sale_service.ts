import { JournalisationModule } from '#models/journalisation'
import Sale, { SaleStatus } from '#models/sale'
import type User from '#models/user'
import { CacheKeys } from '#services/cache/cache_keys'
import CacheService from '#services/cache/cache_service'
import JournalisationService from '#services/journalisation/journalisation_service'
import SaleItemService from '#services/sales/sale_item_service'
import SaleValidationService from '#services/sales/sale_validation_service'
import type { CreateSaleInput } from '#types/sales'
import { dateKeyToDay, dateTimeToDateKey } from '#utils/date_utils'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'

@inject()
export default class SaleService {
  constructor(
    private journalisationService: JournalisationService,
    private saleItemService: SaleItemService,
    private saleValidationService: SaleValidationService,
    private cacheService: CacheService
  ) {}

  /**
   * Recupere les ventes d'une session de caisse.
   */
  async findByCashSession(cashSessionId: string) {
    // Les relations permettent de lire client, vendeur, operateur et services sans snapshot.
    return Sale.query()
      .where('cashSessionId', cashSessionId)
      .where('status', SaleStatus.ACTIVE)
      .preload('customer')
      .preload('operator')
      .preload('seller')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('productService')
      })
      .preload('recoveries')
      .orderBy('saleDate', 'desc')
  }

  /**
   * Recupere les ventes d'une journee metier.
   */
  async findByBusinessDate(date: string) {
    // La clé YYYY-MM-DD est convertie en bornes de journée dans le fuseau métier.
    const startDate = dateKeyToDay(date).toJSDate()
    const endDate = dateKeyToDay(date).endOf('day').toJSDate()

    // Les managers lisent les ventes du jour, toutes caisses confondues.
    return Sale.query()
      .where('status', SaleStatus.ACTIVE)
      .whereBetween('saleDate', [startDate, endDate])
      .preload('customer')
      .preload('operator')
      .preload('seller')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('productService')
      })
      .preload('recoveries')
      .orderBy('saleDate', 'desc')
  }

  /**
   * Cree une vente et ses lignes dans une transaction.
   */
  async create(actor: User, payload: CreateSaleInput) {
    // Les lignes sont preparees avant la transaction pour valider les services et calculer les prix.
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
      // Le numéro d'addition est verrouillé dans la transaction pour éviter deux numéros identiques.
      const additionNumber = await this.generateAdditionNumber(trx)

      // L'entete porte les informations communes a toutes les lignes de vente.
      const sale = await Sale.create(
        {
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

      // Les sorties de stock sont imputees dans la meme transaction que la vente.
      // Si le stock échoue, l'entête de vente et les lignes sont rollback ensemble.
      await this.saleItemService.consumeStockForSale(prepared.items, stockDateKey, trx)

      // Les lignes gardent seulement l'id du service et les montants calcules.
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

      // Si la vente est deja annulee, on ne fait rien et on retourne l'objet.
      if (item.status === SaleStatus.CANCELLED) {
        return item
      }

      // L'annulation retire les sorties de stock associees aux services vendus.
      await this.saleItemService.restoreStockForCancelledSale(
        item.items.map((saleItem) => {
          // Les anciennes ventes doivent rester annulables seulement si leur service est encore correctement lié.
          if (!saleItem.productService?.stockProduct) {
            throw new Error(
              `Le service de la ligne "${saleItem.orderNumber}" n'est pas lie a un produit de stock.`
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
        // La restitution utilise la meme date metier de caisse que la creation de vente.
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
      message: `Addition ${sale.additionNumber} annulee par ${actor.fullName ?? actor.email}.`,
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

  // Genere un numero d'addition sequentiel au format 000000.
  private async generateAdditionNumber(trx: TransactionClientContract) {
    await trx.rawQuery(`SELECT pg_advisory_xact_lock(hashtext('sales_addition_number'))`)

    const result = await trx.rawQuery(`
      SELECT COALESCE(MAX(addition_number::integer), 0) + 1 AS next_number
      FROM sales
    `)
    const nextNumber = Number(result.rows[0]?.next_number ?? 1)

    return String(nextNumber).padStart(5, '0')
  }

  // Convertit la date recue en DateTime, ou utilise l'heure serveur par defaut.
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
