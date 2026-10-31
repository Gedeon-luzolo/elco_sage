import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { isUniqueViolation } from '../../../common/database/database-error.utils.js';
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
   * Services d'une vente ou d'une proforma, indexés par id : chacun une seule fois et tous actifs.
   */
  async findSellableServices(serviceIds: string[]) {
    // Un service ne figure qu'une fois par document.
    if (new Set(serviceIds).size !== serviceIds.length) {
      throw new UnprocessableEntityException(
        'Un service ne peut pas être ajouté plusieurs fois dans le même document.',
      );
    }

    // Seuls les services actifs se vendent ; les produits en stock ne passent pas à la caisse.
    const services = await this.productServicesRepository.find({
      where: {
        id: In(serviceIds),
        type: ProductServiceType.SERVICE,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new UnprocessableEntityException(
        'Un ou plusieurs services sélectionnés sont invalides ou inactifs.',
      );
    }

    return new Map(services.map((service) => [service.id, service]));
  }

  /**
   * Crée un article actif ; le prix est converti dans les deux devises.
   */
  async create(actor: User, dto: CreateProductServiceDto) {
    const fields = await this.buildFields(dto);

    // Deux articles ne peuvent pas porter le même nom : la base le refuse.
    const item = await this.withUniqueName(() =>
      this.productServicesRepository.save(
        this.productServicesRepository.create({
          ...fields,
          // Un nouvel article est toujours actif.
          isActive: true,
        }),
      ),
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

    // Les prix sont recalculés avec le taux courant à chaque modification.
    const fields = await this.buildFields(dto);

    // Un nom déjà porté par un autre article est refusé par la base.
    await this.withUniqueName(() =>
      this.productServicesRepository.update(id, {
        ...fields,
        isActive: dto.isActive,
      }),
    );

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

    // Seul un service peut être lié à un produit, et ce lien est facultatif.
    const stockProductId = isService ? dto.stockProductId : null;

    if (stockProductId) {
      await this.ensureStockProduct(stockProductId);
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
      stockProductId,
      baseUnit: isService ? null : dto.baseUnit,
      packagingUnit: dto.packagingUnit,
      packagingCapacity: dto.packagingCapacity,
      ...this.buildPriceFields(dto.type, prices, dto.packagingCapacity),
    };
  }

  // Le produit lié doit exister et être un produit, pas un autre service.
  private async ensureStockProduct(stockProductId: string) {
    const exists = await this.productServicesRepository.exists({
      where: { id: stockProductId, type: ProductServiceType.PRODUCT },
    });

    if (!exists) {
      throw new UnprocessableEntityException(
        "Le produit lié est introuvable ou n'est pas un produit.",
      );
    }
  }

  // Écrit l'article et traduit le refus de la contrainte d'unicité du nom en message lisible.
  // La contrainte tient aussi face à deux enregistrements simultanés.
  private async withUniqueName<T>(write: () => Promise<T>) {
    try {
      return await write();
    } catch (error) {
      if (isUniqueViolation(error, 'product_services_name_unique')) {
        throw new UnprocessableEntityException(
          'Un article portant ce nom existe déjà.',
        );
      }

      throw error;
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
      materialCostUsd: divider ? prices.usd / divider : 0,
      materialCostCdf: divider ? prices.cdf / divider : 0,
    };
  }

  // Articles triés par nom, avec seulement l'id et le nom de leur catégorie et de leur produit lié.
  private catalogQuery() {
    return this.productServicesRepository
      .createQueryBuilder('item')
      .leftJoin('item.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .leftJoin('item.stockProduct', 'stockProduct')
      .addSelect(['stockProduct.id', 'stockProduct.name'])
      .orderBy('item.name', 'ASC');
  }
}
