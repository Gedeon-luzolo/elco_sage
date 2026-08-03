import StockMovement from '#models/stock_movement'
import ProductService, { ProductServiceType } from '#models/product_service'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import { DateTime } from 'luxon'
import type { StockMovementDTO } from '#transformers/stock_movement_transformer'
import type {
  CreateStockMovementInput,
  ValidatePhysicalStockInput,
} from '#validators/stock_movement'
import { convertToBaseUnit } from '#utils/stock_utils'

const journalisationService = new JournalisationService()

interface GetDailyStockParams {
  date: string // Format: YYYY-MM-DD
}

export default class StockMovementService {
  /**
   * Récupère tous les produits avec leurs mouvements pour une date donnée.
   * Si un produit n'a pas de mouvement, retourne des champs vides avec id: -1
   */
  async getDailyStock({ date }: GetDailyStockParams): Promise<StockMovementDTO[]> {
    const dateMovement = new Date(date)

    // 1. Récupérer tous les produits actifs de type PRODUCT et les mouvements en parallèle
    const [products, movements] = await Promise.all([
      // Recuperer les produits
      ProductService.query()
        .select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity', 'categoryId')
        .where('type', ProductServiceType.PRODUCT)
        .where('isActive', true)
        .preload('category', (query) => query.select('id', 'name'))
        .orderBy('name', 'asc'),

      // Recupérer ensuite le mouvement
      StockMovement.query()
        .where('date', DateTime.fromJSDate(dateMovement).toSQLDate()!)
        .preload('product', (query) =>
          query.select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity')
        ),
    ])

    // 2. Mapper chaque produit avec son mouvement (ou données vides)
    const result: StockMovementDTO[] = []

    for (const product of products) {
      const movement = movements.find((m) => m.productId === product.id)

      if (movement) {
        // Produit avec mouvement existant
        result.push({
          id: movement.id,
          productId: product.id,
          productName: product.name,
          productBaseUnit: product.baseUnit,
          productPackagingUnit: product.packagingUnit,
          productPackagingCapacity: product.packagingCapacity,
          categoryName: product.category?.name ?? null,
          date: movement.date.toISODate()!,
          initialStock: movement.initialStock,
          entries: movement.entries,
          availableStock: movement.availableStock,
          outputs: movement.outputs,
          losses: movement.losses,
          theoreticalStock: movement.theoreticalStock,
          physicalStock: movement.physicalStock,
          variance: movement.variance,
          isPhysicalStockValidated: movement.isPhysicalStockValidated,
        })
      } else {
        // Produit SANS mouvement pour cette date
        // Récupérer le dernier stock physique validé
        const initialStock = await this.getLastValidatedPhysicalStock(product.id, dateMovement)

        result.push({
          id: -1, // Signal: pas de mouvement en base
          productId: product.id,
          productName: product.name,
          productBaseUnit: product.baseUnit,
          productPackagingUnit: product.packagingUnit,
          productPackagingCapacity: product.packagingCapacity,
          categoryName: product.category?.name ?? null,
          date: date,
          initialStock: initialStock,
          entries: null,
          availableStock: null,
          outputs: null,
          losses: null,
          theoreticalStock: null,
          physicalStock: null,
          variance: null,
          isPhysicalStockValidated: false,
        })
      }
    }

    return result
  }

  /**
   * Vérifie si on peut effectuer des opérations pour une date donnée.
   * Retourne false si le stock physique du jour précédent n'est pas validé.
   */
  async canWorkOnDate(productId: string, date: string): Promise<boolean> {
    const dateMovement = new Date(date)
    const previousDate = DateTime.fromJSDate(dateMovement).minus({ days: 1 })

    // Récupérer le mouvement du jour précédent
    const previousMovement = await StockMovement.query()
      .select('physicalStock')
      .where('productId', productId)
      .where('date', previousDate.toSQLDate()!)
      .first()

    // Si pas de mouvement le jour précédent, on peut travailler
    if (!previousMovement) {
      return true
    }

    // Si le stock physique du jour précédent n'est pas validé, on bloque
    return previousMovement.isPhysicalStockValidated
  }

  /**
   * Crée ou met à jour un mouvement de stock pour une date donnée.
   * Cette méthode ne gère QUE les entrées (pas les pertes ni le stock physique).
   * Validation: le stock physique du jour précédent doit être validé.
   */
  async createOrUpdate(actor: User, payload: CreateStockMovementInput) {
    const dateMovement = new Date(payload.date)
    const product = await ProductService.query()
      .select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity')
      .where('id', payload.productId)
      .firstOrFail()

    // Convertir la quantité saisie en unité de base
    const entriesInBaseUnit = convertToBaseUnit(payload.entries, payload.unit, product)

    // Vérifier si on peut travailler sur cette date
    const canWork = await this.canWorkOnDate(payload.productId, payload.date)
    if (!canWork) {
      const previousDate = DateTime.fromJSDate(dateMovement)
        .minus({ days: 1 })
        .toFormat('dd/MM/yyyy')

      // Erreur personnalisée avec la date
      throw new Error(
        `Impossible d'effectuer cette opération. Le stock physique du ${previousDate} pour "${product.name}" n'a pas encore été validé.`
      )
    }

    // Récupérer le mouvement existant
    let movement = await StockMovement.query()
      .where('productId', payload.productId)
      .where('date', DateTime.fromJSDate(dateMovement).toSQLDate()!)
      .first()

    // Calculer le stock initial (= dernier stock physique validé avant cette date)
    const initialStock = await this.getLastValidatedPhysicalStock(payload.productId, dateMovement)

    // Message pour la journalisation avec l'unité d'origine
    const unitLabel = payload.unit === 'base' ? product.baseUnit : product.packagingUnit
    const quantityMessage = `${payload.entries} ${unitLabel}${payload.entries > 1 ? 's' : ''}`

    if (movement) {
      // Mise à jour
      movement.entries = entriesInBaseUnit
      await movement.save()

      // Journaliser l'opération
      await journalisationService.create({
        module: JournalisationModule.INVENTORY,
        message: `Entrées de stock mises à jour pour "${product.name}" le ${DateTime.fromJSDate(dateMovement).toFormat('dd/MM/yyyy')} : ${quantityMessage} par ${actor.fullName ?? actor.email}.`,
        user: actor,
      })
    } else {
      // Création
      movement = await StockMovement.create({
        productId: payload.productId,
        date: DateTime.fromJSDate(dateMovement),
        initialStock,
        entries: entriesInBaseUnit,
        outputs: 0,
        losses: 0,
        physicalStock: null,
      })

      // Journaliser l'opération
      await journalisationService.create({
        module: JournalisationModule.INVENTORY,
        message: `Mouvement de stock créé pour "${product.name}" le ${DateTime.fromJSDate(dateMovement).toFormat('dd/MM/yyyy')} : ${quantityMessage} en entrée par ${actor.fullName ?? actor.email}.`,
        user: actor,
      })
    }

    // Recalculer les autres champs après la mise à jour
    await movement.load('product')
    return movement
  }

  /**
   * Valide le stock physique pour un produit à une date donnée.
   * Les pertes sont saisies EN MÊME TEMPS que le stock physique.
   * Cette action débloque les opérations du jour suivant.
   */
  async validatePhysicalStock(actor: User, payload: ValidatePhysicalStockInput) {
    const dateMovement = new Date(payload.date)
    const product = await ProductService.query()
      .select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity')
      .where('id', payload.productId)
      .firstOrFail()

    // Convertir le stock physique et les pertes en unité de base
    const physicalStockInBaseUnit = convertToBaseUnit(
      payload.physicalStock,
      payload.physicalStockUnit,
      product
    )

    // Qte perdue
    const lossesInBaseUnit = payload.losses
      ? convertToBaseUnit(payload.losses, payload.lossesUnit ?? 'base', product)
      : 0

    // Récupérer le mouvement existant
    const movement = await StockMovement.query()
      .where('productId', payload.productId)
      .where('date', DateTime.fromJSDate(dateMovement).toSQLDate()!)
      .firstOrFail()

    // Mettre à jour le stock physique ET les pertes
    movement.physicalStock = physicalStockInBaseUnit
    movement.losses = lossesInBaseUnit
    await movement.save()

    // Messages pour la journalisation avec les unités d'origine
    const physicalUnitLabel =
      payload.physicalStockUnit === 'base' ? product.baseUnit : product.packagingUnit
    const physicalMessage = `${payload.physicalStock} ${physicalUnitLabel}${payload.physicalStock > 1 ? 's' : ''}`

    // Créer le texte pour les qtes perdus
    let lossesText = ''
    if (payload.losses) {
      const lossesUnitLabel =
        (payload.lossesUnit ?? 'base') === 'base' ? product.baseUnit : product.packagingUnit
      lossesText = ` Pertes: ${payload.losses} ${lossesUnitLabel}${payload.losses > 1 ? 's' : ''}.`
    }

    // Creer une notification
    await journalisationService.create({
      module: JournalisationModule.INVENTORY,
      message: `Stock physique validé pour "${product.name}" le ${DateTime.fromJSDate(dateMovement).toFormat('dd/MM/yyyy')} : ${physicalMessage}.${lossesText} Écart: ${movement.variance ?? 0} ${product.baseUnit}(s). Par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    // Recalculer les autres champs après la mise à jour
    await movement.load('product')
    return movement
  }

  /**
   * Récupère le dernier stock physique validé pour un produit avant une date donnée.
   * Retourne 0 si aucun stock physique n'a été trouvé.
   */
  private async getLastValidatedPhysicalStock(
    productId: string,
    beforeDate: Date
  ): Promise<number> {
    // Recuperer le dernier stock physique saisie
    const lastMovement = await StockMovement.query()
      .select('physicalStock')
      .where('productId', productId)
      .where('date', '<', DateTime.fromJSDate(beforeDate).toSQLDate()!)
      .whereNotNull('physicalStock')
      .orderBy('date', 'desc')
      .first()

    return lastMovement?.physicalStock ?? 0
  }
}
