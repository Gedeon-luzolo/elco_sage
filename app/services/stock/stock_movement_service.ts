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
import { ensureDateIsNotFuture } from '#utils/date_utils'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

const journalisationService = new JournalisationService()

interface GetDailyStockParams {
  date: string // Format: YYYY-MM-DD
}

export interface SaleStockSnapshot {
  productId: string
  availableStock: number
  canSell: boolean
  blockingReason: string | null
}

export default class StockMovementService {
  /**
   * Récupère tous les produits avec leurs mouvements pour une date donnée.
   * Si un produit n'a pas de mouvement, retourne des champs vides avec id: -1
   */
  async getDailyStock({ date }: GetDailyStockParams): Promise<StockMovementDTO[]> {
    ensureDateIsNotFuture(date)

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
      const movement = movements.find((item) => item.productId === product.id)

      if (movement) {
        // Produit avec mouvement existant
        result.push({
          id: movement.id,
          productId: product.id,
          productName: product.name,
          productBaseUnit: product.baseUnit ?? '',
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
          observation: movement.observation,
          isPhysicalStockValidated: movement.isPhysicalStockValidated,
        })
      } else {
        // Produit SANS mouvement pour cette date
        // Récupérer le dernier stock physique validé
        const initialStock = await this.getLastValidatedPhysicalStock(product.id, dateMovement)

        result.push({
          id: -1,
          productId: product.id,
          productName: product.name,
          productBaseUnit: product.baseUnit ?? '',
          productPackagingUnit: product.packagingUnit,
          productPackagingCapacity: product.packagingCapacity,
          categoryName: product.category?.name ?? null,
          date,
          initialStock,
          entries: null,
          availableStock: null,
          outputs: null,
          losses: null,
          theoreticalStock: null,
          physicalStock: null,
          variance: null,
          observation: null,
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
    const previousDate = DateTime.fromJSDate(new Date(date)).minus({ days: 1 })

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
   * Retourne le stock actuellement vendable pour un produit physique.
   */
  async getSaleStockSnapshot(product: ProductService, date: string): Promise<SaleStockSnapshot> {
    ensureDateIsNotFuture(date)

    // La vente est autorisee seulement si la chaine de stock precedente est cloturee.
    // Exemple: si hier a été imputé mais pas validé physiquement, on bloque aujourd'hui.
    const canWork = await this.canWorkOnDate(product.id, date)
    if (!canWork) {
      return {
        productId: product.id,
        availableStock: 0,
        canSell: false,
        blockingReason: `Le stock physique de la veille pour "${product.name}" n'a pas encore ete valide.`,
      }
    }

    // Si le mouvement du jour existe, le stock vendable est le theorique courant.
    const movement = await StockMovement.query()
      .where('productId', product.id)
      .where('date', DateTime.fromISO(date).toSQLDate()!)
      .first()

    if (movement) {
      // Le stock vendable tient compte des ventes déjà passées et des pertes saisies.
      const availableStock = Math.max(0, movement.theoreticalStock)

      return {
        productId: product.id,
        availableStock,
        canSell: availableStock > 0,
        blockingReason:
          availableStock > 0 ? null : `Le stock disponible pour "${product.name}" est epuise.`,
      }
    }

    // Sans mouvement du jour, on part du dernier stock physique valide anterieur.
    // Cela permet de vendre dès le matin même si aucune entrée n'a encore été saisie aujourd'hui.
    const initialStock = await this.getLastValidatedPhysicalStock(product.id, new Date(date))

    return {
      productId: product.id,
      availableStock: Math.max(0, initialStock),
      canSell: initialStock > 0,
      blockingReason: initialStock > 0 ? null : `Aucun stock disponible pour "${product.name}".`,
    }
  }

  /**
   * Impute une sortie de vente sur le mouvement de stock du jour.
   */
  async consumeForSale(
    product: ProductService,
    quantity: number,
    date: string,
    trx: TransactionClientContract
  ) {
    ensureDateIsNotFuture(date)

    // On bloque avant toute ecriture si la veille n'est pas validee.
    // Ce contrôle évite de baser les ventes du jour sur un stock initial encore incertain.
    const canWork = await this.canWorkOnDate(product.id, date)
    if (!canWork) {
      throw new Error(
        `Impossible de vendre "${product.name}". Le stock physique de la veille n'a pas encore ete valide.`
      )
    }

    const movementDate = DateTime.fromJSDate(new Date(date))
    // Le verrou FOR UPDATE protège le stock si deux ventes arrivent en même temps.
    let movement = await StockMovement.query()
      .useTransaction(trx)
      .where('productId', product.id)
      .where('date', movementDate.toSQLDate()!)
      .forUpdate()
      .first()

    // Cree le mouvement du jour si la premiere operation de la journee est une vente.
    if (!movement) {
      // Le stock initial est le dernier stock physique validé avant la date de vente.
      const initialStock = await this.getLastValidatedPhysicalStock(
        product.id,
        movementDate.toJSDate()
      )

      // entries reste à 0: on ne crée pas une entrée, seulement la ligne journalière de suivi.
      movement = await StockMovement.create(
        {
          productId: product.id,
          date: movementDate,
          initialStock,
          entries: 0,
          outputs: 0,
          losses: 0,
          physicalStock: null,
          observation: null,
        },
        { client: trx }
      )
    }

    const nextOutputs = Number(movement.outputs || 0) + quantity
    const nextTheoreticalStock =
      Number(movement.initialStock || 0) +
      Number(movement.entries || 0) -
      nextOutputs -
      Number(movement.losses || 0)

    // La vente ne peut jamais rendre le stock theorique negatif.
    // La validation se fait côté serveur pour bloquer toute manipulation du frontend.
    if (nextTheoreticalStock < 0) {
      throw new Error(`Stock insuffisant pour "${product.name}".`)
    }

    // outputs représente la somme des sorties vendues pour ce produit à cette date.
    movement.outputs = nextOutputs
    await movement.useTransaction(trx).save()

    return movement
  }

  /**
   * Retire une sortie de vente lors de l'annulation d'une vente.
   */
  async restoreForCancelledSale(
    product: ProductService,
    quantity: number,
    date: string,
    trx: TransactionClientContract
  ) {
    ensureDateIsNotFuture(date)

    const movementDate = DateTime.fromJSDate(new Date(date))
    // On verrouille aussi la restauration pour éviter une course avec une nouvelle vente.
    const movement = await StockMovement.query()
      .useTransaction(trx)
      .where('productId', product.id)
      .where('date', movementDate.toSQLDate()!)
      .forUpdate()
      .firstOrFail()

    // Une correction du passe est bloquee si elle casserait un mouvement plus recent.
    await this.ensureMovementCanBeEdited(movement, product.name)

    // On évite une valeur négative si la vente a déjà été restaurée manuellement.
    movement.outputs = Math.max(0, Number(movement.outputs || 0) - quantity)
    await movement.useTransaction(trx).save()

    return movement
  }

  /**
   * Cree les entrees du jour ou corrige les entrees existantes.
   * La creation depend de la validation du jour precedent.
   * La correction depend de l'absence de mouvement futur.
   */
  async createOrUpdate(actor: User, payload: CreateStockMovementInput) {
    ensureDateIsNotFuture(payload.date)

    // On cherche d'abord un mouvement existant pour eviter un doublon produit/date.
    const existingMovement = await StockMovement.query()
      .where('productId', payload.productId)
      .where('date', DateTime.fromJSDate(new Date(payload.date)).toSQLDate()!)
      .first()

    // Un POST sur un mouvement deja existant devient une correction controlee.
    if (existingMovement) {
      return this.updateEntries(actor, existingMovement.id, payload)
    }

    // Le produit est requis pour convertir les quantites et construire les messages d'audit.
    const dateMovement = new Date(payload.date)
    const product = await ProductService.query()
      .select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity')
      .where('id', payload.productId)
      .firstOrFail()

    // Creation seulement si la journee precedente est cloturee par un stock physique.
    const canWork = await this.canWorkOnDate(payload.productId, payload.date)
    if (!canWork) {
      const previousDate = DateTime.fromJSDate(dateMovement)
        .minus({ days: 1 })
        .toFormat('dd/MM/yyyy')

      throw new Error(
        `Impossible d'effectuer cette opération. Le stock physique du ${previousDate} pour "${product.name}" n'a pas encore ete valide.`
      )
    }

    // La base stocke toujours en unite de base, meme si l'utilisateur saisit en conditionnement.
    const entriesInBaseUnit = convertToBaseUnit(payload.entries, payload.unit, product)
    // Le stock initial reprend le dernier stock physique valide avant cette date.
    const initialStock = await this.getLastValidatedPhysicalStock(payload.productId, dateMovement)
    // Une nouvelle ligne demarre avec sorties/pertes a zero; le physique sera impute ensuite.
    const movement = await StockMovement.create({
      productId: payload.productId,
      date: DateTime.fromJSDate(dateMovement),
      initialStock,
      entries: entriesInBaseUnit,
      outputs: 0,
      losses: 0,
      physicalStock: null,
      observation: payload.observation || null,
    })

    const unitLabel = payload.unit === 'base' ? product.baseUnit : product.packagingUnit
    const quantityMessage = `${payload.entries} ${unitLabel}${payload.entries > 1 ? 's' : ''}`

    // L'audit garde la quantite dans l'unite saisie pour rester lisible.
    await journalisationService.create({
      module: JournalisationModule.INVENTORY,
      message: `Mouvement de stock crée pour "${product.name}" le ${DateTime.fromJSDate(dateMovement).toFormat('dd/MM/yyyy')} : ${quantityMessage} en entree par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    await movement.load('product')
    return movement
  }

  /**
   * Corrige les entrees d'un mouvement existant.
   * Refuse la correction si la chaine de stock a deja continue apres cette date.
   */
  async updateEntries(actor: User, id: string, payload: CreateStockMovementInput) {
    ensureDateIsNotFuture(payload.date)

    // Le mouvement cible vient de l'URL PUT; le payload confirme produit/date.
    const movement = await StockMovement.findOrFail(id)
    const product = await ProductService.query()
      .select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity')
      .where('id', movement.productId)
      .firstOrFail()

    // Evite de modifier un mouvement avec les donnees d'un autre produit ou d'une autre date.
    this.ensurePayloadMatchesMovement(movement, payload.productId, payload.date)
    // Des qu'un mouvement futur existe, la correction du passe est bloquee.
    await this.ensureMovementCanBeEdited(movement, product.name)

    // Conversion unique avant sauvegarde pour garder les calculs en unite de base.
    const entriesInBaseUnit = convertToBaseUnit(payload.entries, payload.unit, product)
    const unitLabel = payload.unit === 'base' ? product.baseUnit : product.packagingUnit
    const quantityMessage = `${payload.entries} ${unitLabel}${payload.entries > 1 ? 's' : ''}`

    movement.entries = entriesInBaseUnit
    movement.observation = payload.observation || null
    await movement.save()

    // Trace la correction avec l'auteur et l'unite initialement saisie.
    await journalisationService.create({
      module: JournalisationModule.INVENTORY,
      message: `Entrées de stock mises à jour pour "${product.name}" le ${movement.date.toFormat('dd/MM/yyyy')} : ${quantityMessage} par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    await movement.load('product')
    return movement
  }

  /**
   * Valide le stock physique et les pertes a partir du couple produit/date.
   * Utilise par le POST lorsque le mouvement est retrouve depuis le payload.
   */
  async validatePhysicalStock(actor: User, payload: ValidatePhysicalStockInput) {
    ensureDateIsNotFuture(payload.date)

    // Le POST cible le mouvement par produit/date.
    const dateMovement = new Date(payload.date)
    const movement = await StockMovement.query()
      .where('productId', payload.productId)
      .where('date', DateTime.fromJSDate(dateMovement).toSQLDate()!)
      .firstOrFail()

    // La logique commune applique ensuite les verrous et conversions.
    return this.applyPhysicalStock(actor, movement, payload)
  }

  /**
   * Corrige le stock physique et les pertes par id de mouvement.
   * Utilise par le PUT pour une correction explicite d'un mouvement existant.
   */
  async updatePhysicalStock(actor: User, id: string, payload: ValidatePhysicalStockInput) {
    ensureDateIsNotFuture(payload.date)

    // Le PUT cible le mouvement par id pour corriger une imputation existante.
    const movement = await StockMovement.findOrFail(id)

    // Protection contre une correction croisee entre deux mouvements.
    this.ensurePayloadMatchesMovement(movement, payload.productId, payload.date)
    return this.applyPhysicalStock(actor, movement, payload)
  }

  private async applyPhysicalStock(
    actor: User,
    movement: StockMovement,
    payload: ValidatePhysicalStockInput
  ) {
    // Le produit donne les unites et la capacite de conditionnement.
    const product = await ProductService.query()
      .select('id', 'name', 'baseUnit', 'packagingUnit', 'packagingCapacity')
      .where('id', movement.productId)
      .firstOrFail()

    // Si une journee plus recente existe, modifier ce physique casserait la chaine de stock.
    await this.ensureMovementCanBeEdited(movement, product.name)

    // Stock physique reel converti en unite de base avant persistance.
    const physicalStockInBaseUnit = convertToBaseUnit(
      payload.physicalStock,
      payload.physicalStockUnit,
      product
    )

    // Les pertes sont optionnelles; absence de saisie = zero perte.
    // Qte perdue
    const lossesInBaseUnit = payload.losses
      ? convertToBaseUnit(payload.losses, payload.lossesUnit ?? 'base', product)
      : 0

    // Seuls les champs imputes en fin de journee sont modifies ici.
    movement.physicalStock = physicalStockInBaseUnit
    movement.losses = lossesInBaseUnit
    movement.observation = payload.observation || null
    await movement.save()

    // Messages pour la journalisation avec les unités d'origine
    const physicalUnitLabel =
      payload.physicalStockUnit === 'base' ? product.baseUnit : product.packagingUnit
    const physicalMessage = `${payload.physicalStock} ${physicalUnitLabel}${payload.physicalStock > 1 ? 's' : ''}`

    // Créer le texte pour les qtes perdus
    // Le detail des pertes est ajouté uniquement lorsqu'il existe.
    let lossesText = ''
    if (payload.losses) {
      const lossesUnitLabel =
        (payload.lossesUnit ?? 'base') === 'base' ? product.baseUnit : product.packagingUnit
      lossesText = ` Pertes: ${payload.losses} ${lossesUnitLabel}${payload.losses > 1 ? 's' : ''}.`
    }

    // Creer une notification
    // Journalise l'imputation avec l'ecart calcule par le modele apres sauvegarde.
    await journalisationService.create({
      module: JournalisationModule.INVENTORY,
      message: `Stock physique valide pour "${product.name}" le ${movement.date.toFormat('dd/MM/yyyy')} : ${physicalMessage}.${lossesText} Ecart: ${movement.variance ?? 0} ${product.baseUnit}(s). Par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    // Recalculer les autres champs après la mise à jour
    await movement.load('product')
    return movement
  }

  // verifie que le payload correspond bien au mouvement cible pour eviter les corrections croisées
  private ensurePayloadMatchesMovement(movement: StockMovement, productId: string, date: string) {
    if (movement.productId !== productId || movement.date.toISODate() !== date) {
      throw new Error('Les donnees envoyees ne correspondent pas au mouvement a modifier.')
    }
  }

  private async ensureMovementCanBeEdited(movement: StockMovement, productName: string) {
    // On cherche n'importe quel mouvement futur, pas seulement J+1, pour proteger les trous de date.
    const nextMovement = await StockMovement.query()
      .select('id', 'date')
      .where('productId', movement.productId)
      .where('date', '>', movement.date.toSQLDate()!)
      .orderBy('date', 'asc')
      .first()

    // Si un mouvement futur existe, modifier le passe casserait son stock initial/theorique.
    if (nextMovement) {
      throw new Error(
        `Impossible de modifier le mouvement du ${movement.date.toFormat('dd/MM/yyyy')} pour "${productName}". Un mouvement existe deja le ${nextMovement.date.toFormat('dd/MM/yyyy')}.`
      )
    }
  }

  /**
   * Recupere le dernier stock physique valide avant une date donnee.
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
