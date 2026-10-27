import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Not, Repository } from 'typeorm';
import { AccessTokensService } from '../../auth/services/access-tokens.service.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import type {
  CreateUserDto,
  UpdateUserDto,
} from '../dto/create-update-user.dto.js';
import { User } from '../entities/user.entity.js';
import { UserRole, UserStatus } from '../enums/user.enums.js';
import { isManagementRole } from '../utils/user.utils.js';

// Mot de passe initial à communiquer au nouvel utilisateur.
const DEFAULT_USER_PASSWORD = '12345678';

type UserStatsRow = {
  stats_total: number;
  stats_active: number;
  stats_inactive: number;
  stats_blocked: number;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accessTokensService: AccessTokensService,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Comptes récents (hors administrateur) avec les compteurs par statut de toute la table.
   */
  async getOverview(limit = 30) {
    // Une seule requête : les comptes récents, et les compteurs de toute la table répétés sur chaque ligne.
    // Les fenêtres « over () » sont calculées avant le LIMIT : elles comptent tous les comptes, pas les 30 affichés.
    const { entities: users, raw } = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('count(*) over ()::int', 'stats_total')
      .addSelect(
        'count(*) filter (where user.status = :active) over ()::int',
        'stats_active',
      )
      .addSelect(
        'count(*) filter (where user.status = :inactive) over ()::int',
        'stats_inactive',
      )
      .addSelect(
        'count(*) filter (where user.status = :blocked) over ()::int',
        'stats_blocked',
      )
      .where('user.role <> :admin', { admin: UserRole.ADMIN })
      .setParameters({
        active: UserStatus.ACTIVE,
        inactive: UserStatus.INACTIVE,
        blocked: UserStatus.BLOCKED,
      })
      .orderBy('user.createdAt', 'DESC')
      .limit(limit)
      .getRawAndEntities<UserStatsRow>();

    // Les compteurs sont identiques sur toutes les lignes : on lit la première (absente si aucun compte).
    const [counts] = raw;
    const stats = {
      total: counts?.stats_total ?? 0,
      active: counts?.stats_active ?? 0,
      inactive: counts?.stats_inactive ?? 0,
      blocked: counts?.stats_blocked ?? 0,
    };

    // Liste, compteurs et répartition alimentent les cartes et le graphique de la page.
    return {
      users,
      stats,
      statusDistribution: [
        { status: UserStatus.ACTIVE, total: stats.active },
        { status: UserStatus.INACTIVE, total: stats.inactive },
        { status: UserStatus.BLOCKED, total: stats.blocked },
      ],
    };
  }

  /**
   * Opérateurs sélectionnables sur une vente : toute personne active sauf l'administrateur.
   */
  async getActiveOperatorsForSale() {
    // Triés par nom pour la liste déroulante de la caisse ; seul de quoi les afficher sort.
    return this.usersRepository.find({
      select: { id: true, fullName: true, email: true },
      where: { role: Not(UserRole.ADMIN), status: UserStatus.ACTIVE },
      order: { fullName: 'ASC' },
    });
  }

  /**
   * Crée un compte et renvoie le mot de passe initial à communiquer.
   */
  async create(actor: User, dto: CreateUserDto) {
    this.ensureCanManageUsers(actor);
    // Un email ne peut servir qu'à un seul compte.
    await this.ensureEmailAvailable(dto.email);

    // Le mot de passe initial est haché ; le compte est actif sauf statut choisi.
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        fullName: dto.fullName,
        email: dto.email,
        password: await bcrypt.hash(DEFAULT_USER_PASSWORD, 10),
        role: dto.role,
        status: dto.status ?? UserStatus.ACTIVE,
        failedLoginAttempts: 0,
      }),
    );

    await this.journalisationsService.create(
      JournalisationModule.USERS,
      // La création est tracée dans le journal.
      `Le compte ${user.fullName ?? user.email} a été créé par ${actor.fullName ?? actor.email}`,
      actor,
    );

    // Le mot de passe initial est affiché une fois pour être communiqué.
    return { temporaryPassword: DEFAULT_USER_PASSWORD };
  }

  /**
   * Met à jour un compte. Le mot de passe ne change pas par cette action.
   */
  async update(actor: User, userId: string, dto: UpdateUserDto) {
    this.ensureCanManageUsers(actor);

    // On ne se coupe jamais soi-même l'accès : ni désactivation, ni perte du rôle de direction.
    if (actor.id === userId) {
      this.ensureKeepsOwnAccess(dto);
    }

    const user = await this.findOrFail(userId);

    // L'email n'est revérifié que s'il change réellement.
    if (dto.email !== user.email) {
      await this.ensureEmailAvailable(dto.email, user.id);
    }

    // Seul le profil change : le mot de passe reste celui du compte.
    await this.usersRepository.update(user.id, {
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role,
      status: dto.status,
      // Un compte qui redevient actif repart sans échec de connexion, sinon il serait rebloqué à la prochaine erreur.
      ...(dto.status === UserStatus.ACTIVE && user.status !== UserStatus.ACTIVE
        ? { failedLoginAttempts: 0 }
        : {}),
    });

    // Un compte qui n'est plus actif perd immédiatement toutes ses connexions.
    if (dto.status !== UserStatus.ACTIVE) {
      await this.accessTokensService.deleteAllForUser(user.id);
    }

    await this.journalisationsService.create(
      JournalisationModule.USERS,
      // La modification est tracée dans le journal.
      `Le compte ${dto.fullName ?? dto.email} a été mis à jour par ${actor.fullName ?? actor.email}`,
      actor,
    );
  }

  // Refuse qu'on désactive son propre compte ou qu'on se retire le rôle de direction.
  private ensureKeepsOwnAccess(dto: UpdateUserDto) {
    if (dto.status !== UserStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        'Vous ne pouvez pas désactiver votre propre compte',
      );
    }

    if (!isManagementRole(dto.role)) {
      throw new UnprocessableEntityException(
        'Vous ne pouvez pas vous retirer le rôle de direction',
      );
    }
  }

  private async findOrFail(userId: string) {
    // Un id inconnu répond 404 plutôt qu'une erreur SQL.
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  // Seule la direction gère les comptes ; le rôle vient du token, jamais du formulaire.
  private ensureCanManageUsers(actor: User) {
    if (!isManagementRole(actor.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit de gérer les utilisateurs",
      );
    }
  }

  // Refuse un email déjà porté par un autre compte.
  private async ensureEmailAvailable(email: string, ignoredUserId?: string) {
    // En modification, le compte lui-même est ignoré.
    const taken = await this.usersRepository.exists({
      where: { email, ...(ignoredUserId ? { id: Not(ignoredUserId) } : {}) },
    });

    if (taken) {
      throw new UnprocessableEntityException(
        'Cet email est déjà utilisé par un autre utilisateur',
      );
    }
  }
}
