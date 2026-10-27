import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import type { User } from '../../users/entities/user.entity.js';
import type {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/create-update-product-category.dto.js';
import { ProductCategory } from './entities/product-category.entity.js';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Toutes les catégories avec leurs compteurs. Elles changent rarement : cache long.
   */
  async getOverview() {
    // Toute la table est renvoyée, sans pagination.
    const categories = await this.categoriesRepository.find({
      order: { name: 'ASC' },
    });

    // Les compteurs se calculent sur la liste déjà chargée.
    const total = categories.length;
    const activeCount = categories.filter(
      (category) => category.isActive,
    ).length;

    return {
      categories,
      stats: { total, activeCount, inactiveCount: total - activeCount },
    };
  }

  /**
   * Catégories actives, proposées dans le formulaire du catalogue.
   */
  async getActive() {
    return this.categoriesRepository.find({
      // Seules les catégories actives peuvent recevoir un article.
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Crée une catégorie, toujours active.
   */
  async create(actor: User, dto: CreateProductCategoryDto) {
    // Deux catégories ne peuvent pas porter le même nom.
    await this.ensureNameAvailable(dto.name);

    // Une nouvelle catégorie est toujours active.
    const category = await this.categoriesRepository.save(
      this.categoriesRepository.create({ name: dto.name, isActive: true }),
    );

    await this.journalisationsService.create(
      JournalisationModule.PRODUCT_CATEGORIES,
      // La création est tracée dans le journal.
      `La catégorie de service "${category.name}" a été créée par ${actor.fullName ?? actor.email}.`,
      actor,
    );

    return category;
  }

  /**
   * Modifie le nom et le statut d'une catégorie.
   */
  async update(actor: User, id: string, dto: UpdateProductCategoryDto) {
    const category = await this.findOrFail(id);

    // Le nom n'est revérifié que s'il change réellement.
    if (dto.name !== category.name) {
      await this.ensureNameAvailable(dto.name, id);
    }

    // Nom et statut sont toujours envoyés par le formulaire d'édition.
    await this.categoriesRepository.update(id, {
      name: dto.name,
      isActive: dto.isActive,
    });

    await this.journalisationsService.create(
      JournalisationModule.PRODUCT_CATEGORIES,
      // La modification est tracée dans le journal.
      `La catégorie "${category.name}" a été mise à jour par ${actor.fullName ?? actor.email}.`,
      actor,
    );
  }

  private async findOrFail(id: string) {
    // Un id inconnu répond 404 plutôt qu'une erreur SQL.
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    return category;
  }

  private async ensureNameAvailable(name: string, ignoredId?: string) {
    // En modification, la catégorie elle-même est ignorée.
    const taken = await this.categoriesRepository.exists({
      where: { name, ...(ignoredId ? { id: Not(ignoredId) } : {}) },
    });

    if (taken) {
      throw new UnprocessableEntityException(
        'Une catégorie portant ce nom existe déjà.',
      );
    }
  }
}
