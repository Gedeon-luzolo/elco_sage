import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CacheKeys } from '../../../common/cache/cache-keys.js';
import { CacheService } from '../../../common/cache/cache.service.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import { User } from '../../users/entities/user.entity.js';
import { UserStatus } from '../../users/enums/user.enums.js';
import { toUserResponse } from '../../users/utils/user.utils.js';
import { AccessTokensService } from './access-tokens.service.js';

const MAX_FAILED_LOGIN_ATTEMPTS = 3;

// Même message que l'email existe ou non : on n'aide pas à deviner les comptes.
const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly accessTokensService: AccessTokensService,
    private readonly journalisationsService: JournalisationsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Échange email et mot de passe contre un token d'accès.
   * Bloque le compte à la 3e erreur de mot de passe.
   */
  async login(email: string, password: string) {
    // Le mot de passe n'est jamais lu par défaut : on le demande explicitement ici.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Un compte inactif ou bloqué ne passe jamais à la vérification du mot de passe.
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        user.status === UserStatus.BLOCKED
          ? 'Ce compte est bloqué. Contactez un administrateur.'
          : 'Ce compte est inactif. Contactez un administrateur.',
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      await this.registerFailedAttempt(user);
    }

    // Une connexion réussie remet le compteur à zéro.
    if (user.failedLoginAttempts > 0) {
      await this.usersRepository.update(user.id, { failedLoginAttempts: 0 });
      await this.cacheService.forgetByPrefix(CacheKeys.users.prefix);
    }

    const token = await this.accessTokensService.create(user.id);

    await this.journalisationsService.create(
      JournalisationModule.AUTHENTIFICATION,
      `${user.fullName ?? user.email} vient de se connecter au système`,
      user,
    );

    // Le token n'est visible qu'ici : il ne pourra plus être relu ensuite.
    return {
      token: token.value,
      expiresAt: token.expiresAt,
      user: toUserResponse(user),
    };
  }

  /**
   * Révoque le token de l'appareil courant.
   */
  async logout(user: User, accessTokenId: string) {
    await this.journalisationsService.create(
      JournalisationModule.AUTHENTIFICATION,
      `${user.fullName ?? user.email} vient de se déconnecter du système`,
      user,
    );

    await this.accessTokensService.delete(accessTokenId);
  }

  /**
   * Retrouve l'utilisateur d'un token, seulement si son compte est encore actif.
   */
  async findAuthenticatedUser(userId: string) {
    return this.usersRepository.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
    });
  }

  // Compte une erreur de mot de passe, bloque au seuil, puis refuse toujours la connexion.
  private async registerFailedAttempt(user: User): Promise<never> {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const isBlocked = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

    await this.usersRepository.update(user.id, {
      failedLoginAttempts,
      ...(isBlocked ? { status: UserStatus.BLOCKED } : {}),
    });
    await this.cacheService.forgetByPrefix(CacheKeys.users.prefix);

    if (!isBlocked) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Un compte bloqué perd toutes ses connexions déjà ouvertes.
    await this.accessTokensService.deleteAllForUser(user.id);

    await this.journalisationsService.create(
      JournalisationModule.AUTHENTIFICATION,
      `Le compte de ${user.fullName ?? user.email} a été automatiquement bloqué après ${MAX_FAILED_LOGIN_ATTEMPTS} tentatives de connexion échouées`,
      user,
    );

    throw new UnauthorizedException(
      'Compte bloqué après 3 tentatives de connexion échouées',
    );
  }
}
