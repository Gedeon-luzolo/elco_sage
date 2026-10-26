import ProductCategory from '#models/product_category'
import ProductService, { ProductServiceType } from '#models/product_service'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

// Taux utilisé pour dériver les prix USD des prix CDF.
const CDF_PER_USD = 2400

interface ProductSeed {
  category: string
  name: string
  baseUnit: string
  packagingUnit: string
  packagingCapacity: number
  priceCdf: number
}

interface ServiceSeed {
  category: string
  name: string
  priceCdf: number
  stockProduct?: string
}

// Les prix des produits sont ceux du conditionnement complet.
const PRODUCTS: ProductSeed[] = [
  {
    category: 'Fourniture',
    name: 'Papier A4',
    baseUnit: 'Feuille',
    packagingUnit: 'Rame',
    packagingCapacity: 500,
    priceCdf: 24000,
  },
  {
    category: 'Fourniture',
    name: 'Papier A3',
    baseUnit: 'Feuille',
    packagingUnit: 'Rame',
    packagingCapacity: 500,
    priceCdf: 48000,
  },
  {
    category: 'Fourniture',
    name: 'Papier photo A4',
    baseUnit: 'Feuille',
    packagingUnit: 'Paquet',
    packagingCapacity: 50,
    priceCdf: 30000,
  },
  {
    category: 'Fourniture',
    name: 'Pochette de plastification A4',
    baseUnit: 'Pochette',
    packagingUnit: 'Boîte',
    packagingCapacity: 100,
    priceCdf: 36000,
  },
  {
    category: 'Fourniture',
    name: 'Spirale de reliure',
    baseUnit: 'Spirale',
    packagingUnit: 'Boîte',
    packagingCapacity: 100,
    priceCdf: 24000,
  },
]

// Un service lié à un produit consomme son stock à chaque vente.
const SERVICES: ServiceSeed[] = [
  {
    category: 'Impression',
    name: 'Impression A4 Noir & blanc',
    priceCdf: 200,
    stockProduct: 'Papier A4',
  },
  {
    category: 'Impression',
    name: 'Impression A4 Couleur',
    priceCdf: 500,
    stockProduct: 'Papier A4',
  },
  {
    category: 'Impression',
    name: 'Impression A3 Noir & blanc',
    priceCdf: 500,
    stockProduct: 'Papier A3',
  },
  {
    category: 'Impression',
    name: 'Impression A3 Couleur',
    priceCdf: 1000,
    stockProduct: 'Papier A3',
  },
  {
    category: 'Impression',
    name: 'Impression photo A4',
    priceCdf: 2500,
    stockProduct: 'Papier photo A4',
  },
  {
    category: 'Photocopie',
    name: 'Photocopie A4 Noir & blanc',
    priceCdf: 100,
    stockProduct: 'Papier A4',
  },
  {
    category: 'Photocopie',
    name: 'Photocopie A4 Couleur',
    priceCdf: 400,
    stockProduct: 'Papier A4',
  },
  {
    category: 'Photocopie',
    name: 'Photocopie A3 Noir & blanc',
    priceCdf: 300,
    stockProduct: 'Papier A3',
  },
  {
    category: 'Finition',
    name: 'Plastification A4',
    priceCdf: 1500,
    stockProduct: 'Pochette de plastification A4',
  },
  {
    category: 'Finition',
    name: 'Reliure spirale',
    priceCdf: 3000,
    stockProduct: 'Spirale de reliure',
  },
  { category: 'Bureautique', name: 'Saisie de texte (page)', priceCdf: 1000 },
  { category: 'Bureautique', name: 'Scan (page)', priceCdf: 300 },
]

export default class ProductSeeder extends BaseSeeder {
  /**
   * Crée un catalogue de départ : catégories, produits en stock et services.
   * Le seed reste idempotent grâce à updateOrCreate sur le nom.
   */
  async run() {
    // Les catégories sont créées d'abord pour pouvoir y rattacher le catalogue.
    const categoryNames = [...new Set([...PRODUCTS, ...SERVICES].map((item) => item.category))]
    const categoryIds = new Map<string, string>()

    for (const name of categoryNames) {
      const category = await ProductCategory.updateOrCreate({ name }, { name, isActive: true })
      categoryIds.set(name, category.id)
    }

    // Les produits passent avant les services, qui pointent vers leur stock.
    const productIds = new Map<string, string>()

    for (const product of PRODUCTS) {
      const priceUsd = toUsd(product.priceCdf)

      // Le coût matière est celui d'une unité de base : prix du conditionnement / capacité.
      const item = await ProductService.updateOrCreate(
        { name: product.name },
        {
          categoryId: categoryIds.get(product.category)!,
          type: ProductServiceType.PRODUCT,
          name: product.name,
          isActive: true,
          stockProductId: null,
          baseUnit: product.baseUnit,
          packagingUnit: product.packagingUnit,
          packagingCapacity: product.packagingCapacity,
          priceCdf: product.priceCdf,
          priceUsd,
          materialCostCdf: product.priceCdf / product.packagingCapacity,
          materialCostUsd: priceUsd / product.packagingCapacity,
        }
      )
      productIds.set(product.name, item.id)
    }

    // Un service n'a pas de coût matière direct : il consomme le produit lié.
    for (const service of SERVICES) {
      await ProductService.updateOrCreate(
        { name: service.name },
        {
          categoryId: categoryIds.get(service.category)!,
          type: ProductServiceType.SERVICE,
          name: service.name,
          isActive: true,
          stockProductId: service.stockProduct ? productIds.get(service.stockProduct)! : null,
          baseUnit: null,
          packagingUnit: null,
          packagingCapacity: null,
          priceCdf: service.priceCdf,
          priceUsd: toUsd(service.priceCdf),
          materialCostCdf: 0,
          materialCostUsd: 0,
        }
      )
    }
  }
}

// Arrondit au centime, comme les colonnes decimal(15, 2).
function toUsd(priceCdf: number) {
  return Math.round((priceCdf / CDF_PER_USD) * 100) / 100
}
