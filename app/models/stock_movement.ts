import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, belongsTo, column, computed } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ProductService from '#models/product_service'
import { decimalColumn } from '#utils/decimal_column'

export default class StockMovement extends BaseModel {
  public static table = 'stock_movements'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare productId: string

  @column.date()
  declare date: DateTime

  /** Stock initial (hérité du stock physique du jour précédent) */
  @column(decimalColumn)
  declare initialStock: number

  /** Entrées (achats, réceptions) - saisie manuelle */
  @column(decimalColumn)
  declare entries: number

  /** Sorties (ventes) - automatique via système de ventes */
  @column(decimalColumn)
  declare outputs: number

  /** Pertes (casse, vol, avarie) - saisie manuelle */
  @column(decimalColumn)
  declare losses: number | null

  /** Stock physique (inventaire réel) - saisie manuelle en fin de journée */
  @column(decimalColumn)
  declare physicalStock: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => ProductService, { foreignKey: 'productId' })
  declare product: BelongsTo<typeof ProductService>

  /**
   * Vérifie si le stock physique a été validé
   * Un stock physique non-null signifie qu'il a été validé
   */
  @computed()
  get isPhysicalStockValidated(): boolean {
    return this.physicalStock !== null
  }

  /**
   * Stock disponible = Stock initial + Entrées
   * Représente le stock avant les sorties et pertes
   */
  @computed()
  get availableStock(): number {
    return this.initialStock + this.entries
  }

  /**
   * Stock théorique = Stock disponible - Sorties - Pertes
   * Représente le stock qu'on devrait avoir selon les calculs
   */
  @computed()
  get theoreticalStock(): number {
    const losses = this.losses ?? 0
    return this.availableStock - this.outputs - losses
  }

  /**
   * Écart = Stock physique - Stock théorique
   * Positif = surplus, Négatif = manquant
   * Retourne null si le stock physique n'est pas encore saisi
   */
  @computed()
  get variance(): number | null {
    if (this.physicalStock === null) {
      return null
    }
    return this.physicalStock - this.theoreticalStock
  }

  @beforeCreate()
  static assignUuid(stockMovement: StockMovement) {
    stockMovement.id = stockMovement.id || randomUUID()
  }
}
