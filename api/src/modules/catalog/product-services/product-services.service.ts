import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ExchangeRatesService } from '../../exchange-rates/exchange-rates.service.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import type { User } from '../../users/entities/user.entity.js';
import type {
  CreateProductServiceDto,
  UpdateProductServiceDto,
} from './dto/create-update-product-service.dto.js';
import { ProductService } from './entities/product-service.entity.js';
import { ProductServiceType } from './enums/product-service-type.enum.js';

@Injectable()
export class ProductServicesService {
  constructor(
    @InjectRepository(ProductService)
    private readonly productServicesRepository: Repository<ProductService>,
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Catalogue complet, séparé en produits et services, avec ses compteurs.
   */
  async getOverview() {
    // Tout le catalogue est renvoyé, sans pagination, avec le nom de sa catégorie.
    const items = await this.catalogQuery().getMany();

    // L'écran présente les produits et les services dans deux onglets.
    const products = items.filter(
      (item) => item.type === ProductServiceType.PRODUCT,
    );
    const services = items.filter(
      (item) => item.type === ProductServiceType.SERVICE,
    );

    // Les compteurs se calculent sur la liste déjà chargée.
    const total = items.length;
    const activeCount = items.filter((item) => item.isActive).length;

    return {
      products,
      services,
      stats: {
        total,
        activeCount,
        inactiveCount: total - activeCount,
        productCount: products.length,
        serviceCount: services.length,
      },
    };
  }

  /**
   * Services actifs vendables : la vente ne vend que des prestations, pas les produits en stock.
   */
  async getActiveServicesForSale() {
    // Seuls les services actifs se vendent à la caisse.
    return this.catalogQuery()
      .where('item.type = :service', { service: ProductServiceType.SERVICE })
      .andWhere('item.is_active')
      .getMany();
  }

  /**
   * Crée un article actif ; le prix est converti dans les deux devises.
   */
  async create(actor: User, dto: CreateProductServiceDto) {
    // Deux articles ne peuvent pas porter le même nom.
    await this.ensureNameAvailable(dto.name);

    const item = await this.productServicesRepository.save(
      this.productServicesRepository.create({
        ...(await this.buildFields(dto)),
        // Un nouvel article est toujours actif.
        isActive: true,
      }),
    );

    await this.journalisationsService.create(
      JournalisationModule.PRODUCT_SERVICES,
      // La création est tracée dans le journal.
      `Le produit/service "${item.name}" a été créé par ${actor.fullName ?? actor.email}.`,
      actor,
    );

    // La SPA n'a besoin que de l'id : elle relit le catalogue ensuite.
    return { id: item.id };
  }

  /**
   * Modifie un article et recalcule ses prix.
   */
  async update(actor: User, id: string, dto: UpdateProductServiceDto) {
    // Un id inconnu répond 404 plutôt qu'une erreur SQL.
    const item = await this.productServicesRepository.findOne({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Article introuvable.');
    }

    // Le nom n'est revérifié que s'il change réellement.
    if (dto.name !== item.name) {
      await this.ensureNameAvailable(dto.name, id);
    }

    // Les prix sont recalculés avec le taux courant à chaque modification.
    await this.productServicesRepository.update(id, {
      ...(await this.buildFields(dto)),
      isActive: dto.isActive,
    });

    await this.journalisationsService.create(
      JournalisationModule.PRODUCT_SERVICES,
      `Le produit/service "${item.name}" a été mis à jour par ${actor.fullName ?? actor.email}.`,
      actor,
    );
  }

  // Champs communs à la création et à la modification.
  private async buildFields(dto: CreateProductServiceDto) {
    // Un service consomme l'unité du produit lié : sa propre unité est inutile.
    const isService = dto.type === ProductServiceType.SERVICE;

    // Un produit se stocke : son unité de base est obligatoire.
    if (!isService && !dto.baseUnit) {
      throw new UnprocessableEntityException(
        "Renseignez l'unité de base du produit.",
      );
    }

    // Le prix est saisi dans une devise et converti dans l'autre.
    const prices = await this.exchangeRatesService.toBothCurrencies(
      dto.price,
      dto.currency,
    );

    return {
      type: dto.type,
      name: dto.name,
      categoryId: dto.categoryId,
      baseUnit: isService ? null : dto.baseUnit,
      packagingUnit: dto.packagingUnit,
      packagingCapacity: dto.packagingCapacity,
      ...this.buildPriceFields(dto.type, prices, dto.packagingCapacity),
    };
  }

  private async ensureNameAvailable(name: string, ignoredId?: string) {
    // En modification, l'article lui-même est ignoré.
    const taken = await this.productServicesRepository.exists({
      where: { name, ...(ignoredId ? { id: Not(ignoredId) } : {}) },
    });

    if (taken) {
      throw new UnprocessableEntityException(
        'Un article portant ce nom existe déjà.',
      );
    }
  }

  // Prix enregistrés et coût matière d'une unité de base.
  // Un service n'a pas de coût matière direct ; un produit est saisi au prix du conditionnement.
  private buildPriceFields(
    type: ProductServiceType,
    prices: { usd: number; cdf: number },
    packagingCapacity: number | null,
  ) {
    // Un service n'a pas de diviseur ; un conditionnement sans capacité compte pour une unité.
    const divider =
      type === ProductServiceType.SERVICE ? null : packagingCapacity || 1;

    return {
      priceUsd: prices.usd,
      priceCdf: prices.cdf,
      // Le coût matière d'un produit est le prix du conditionnement divisé par sa capacité.
      materialCostUsd: divider ? prices.usd / divider : 0,
      materialCostCdf: divider ? prices.cdf / divider : 0,
    };
  }

  // Articles triés par nom, avec seulement l'id et le nom de leur catégorie.
  private catalogQuery() {
    return this.productServicesRepository
      .createQueryBuilder('item')
      .leftJoin('item.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .orderBy('item.name', 'ASC');
  }
}
