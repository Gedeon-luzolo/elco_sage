import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from '../../modules/catalog/product-categories/entities/product-category.entity.js';
import { ProductService } from '../../modules/catalog/product-services/entities/product-service.entity.js';
import { ProductServiceType } from '../../modules/catalog/product-services/enums/product-service-type.enum.js';

// Taux utilisé pour dériver les prix USD des prix CDF.
const CDF_PER_USD = 2400;

type ProductSeed = {
  category: string;
  name: string;
  baseUnit: string;
  packagingUnit: string;
  packagingCapacity: number;
  priceCdf: number;
};

type ServiceSeed = {
  category: string;
  name: string;
  priceCdf: number;
  stockProduct?: string;
};

// Arrondit au centime, comme les colonnes numeric(15, 2).
const toUsd = (priceCdf: number) =>
  Math.round((priceCdf / CDF_PER_USD) * 100) / 100;

@Injectable()
export class CatalogSeeder {
  private readonly logger = new Logger(CatalogSeeder.name);

  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(ProductService)
    private readonly productServicesRepository: Repository<ProductService>,
  ) {}

  // Les prix des produits sont ceux du conditionnement complet.
  private readonly products: ProductSeed[] = [
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
  ];
  private readonly services: ServiceSeed[] = [
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
  ];

  /**
   * Crée le catalogue de départ : catégories, produits en stock et services.
   * Idempotent : un élément existant (même nom) est mis à jour, jamais dupliqué.
   */
  async seed() {
    // Les catégories d'abord, pour y rattacher le catalogue.
    const categoryIds = new Map<string, string>();
    const categoryNames = [
      ...new Set(
        [...this.products, ...this.services].map((item) => item.category),
      ),
    ];

    for (const name of categoryNames) {
      const category = await this.upsertByName(
        this.categoriesRepository,
        name,
        {
          name,
          isActive: true,
        },
      );
      categoryIds.set(name, category.id);
    }

    // Les produits passent avant les services, qui pointent vers leur stock.
    const productIds = new Map<string, string>();

    for (const product of this.products) {
      const priceUsd = toUsd(product.priceCdf);

      // Le coût matière est celui d'une unité de base : prix du conditionnement / capacité.
      const saved = await this.upsertByName(
        this.productServicesRepository,
        product.name,
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
        },
      );
      productIds.set(product.name, saved.id);
    }

    // Un service n'a pas de coût matière direct : il consomme le produit lié.
    for (const service of this.services) {
      await this.upsertByName(this.productServicesRepository, service.name, {
        categoryId: categoryIds.get(service.category)!,
        type: ProductServiceType.SERVICE,
        name: service.name,
        isActive: true,
        stockProductId: service.stockProduct
          ? productIds.get(service.stockProduct)!
          : null,
        baseUnit: null,
        packagingUnit: null,
        packagingCapacity: null,
        priceCdf: service.priceCdf,
        priceUsd: toUsd(service.priceCdf),
        materialCostCdf: 0,
        materialCostUsd: 0,
      });
    }

    this.logger.log(
      `Catalogue prêt : ${categoryNames.length} catégories, ${this.products.length} produits, ${this.services.length} services.`,
    );
  }

  // Met à jour l'élément de même nom, ou le crée.
  private async upsertByName<T extends { id: string; name: string }>(
    repository: Repository<T>,
    name: string,
    values: Partial<T>,
  ): Promise<T> {
    const existing = await repository.findOne({ where: { name } as never });

    return repository.save(
      repository.merge(existing ?? repository.create(), values as never),
    );
  }
}
