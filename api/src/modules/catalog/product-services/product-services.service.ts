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
import {
  buildPriceFields,
  toProductServiceResponse,
} from './utils/product-service.utils.js';

type ProductServiceStatsRow = {
  stats_total: number;
  stats_active: number;
  stats_products: number;
  stats_services: number;
};

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
    // Une seule requête : les articles, et les compteurs de tout le catalogue répétés sur chaque ligne.
    const { entities, raw } = await this.productServicesRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .addSelect('count(*) over ()::int', 'stats_total')
      .addSelect(
        'count(*) filter (where item.is_active) over ()::int',
        'stats_active',
      )
      .addSelect(
        'count(*) filter (where item.type = :product) over ()::int',
        'stats_products',
      )
      .addSelect(
        'count(*) filter (where item.type = :service) over ()::int',
        'stats_services',
      )
      .setParameters({
        product: ProductServiceType.PRODUCT,
        service: ProductServiceType.SERVICE,
      })
      .orderBy('item.name', 'ASC')
      .getRawAndEntities<ProductServiceStatsRow>();

    // Les compteurs sont identiques sur toutes les lignes : on lit la première (absente si le catalogue est vide).
    const [counts] = raw;
    const total = counts?.stats_total ?? 0;
    const activeCount = counts?.stats_active ?? 0;

    // L'écran présente les produits et les services dans deux onglets.
    const items = entities.map(toProductServiceResponse);

    return {
      products: items.filter(
        (item) => item.type === ProductServiceType.PRODUCT,
      ),
      services: items.filter(
        (item) => item.type === ProductServiceType.SERVICE,
      ),
      stats: {
        total,
        activeCount,
        inactiveCount: total - activeCount,
        productCount: counts?.stats_products ?? 0,
        serviceCount: counts?.stats_services ?? 0,
      },
    };
  }

  /**
   * Services actifs vendables : la vente ne vend que des prestations, pas les produits en stock.
   */
  async getActiveServicesForSale() {
    return (
      await this.productServicesRepository.find({
        // Seuls les services actifs se vendent à la caisse.
        where: { type: ProductServiceType.SERVICE, isActive: true },
        relations: { category: true },
        order: { name: 'ASC' },
      })
    ).map(toProductServiceResponse);
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
      ...buildPriceFields(dto.type, prices, dto.packagingCapacity),
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
}
