import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import { User } from '../../users/entities/user.entity.js';
import { UserStatus } from '../../users/enums/user.enums.js';
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
  ) {}

  /**
   * Échange email et mot de passe contre un token d'accès.
   * Bloque le compte à la 3e erreur de mot de passe.
   */
  async login(email: string, password: string) {
    // Le mot de passe et le compteur d'échecs ne sont jamais lus par défaut : on les demande ici.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.password', 'user.failedLoginAttempts'])
      .where('user.email = :email', { email })
      .getOne();

    // Email inconnu : même message qu'un mauvais mot de passe.
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

    // Un mauvais mot de passe est compté, et peut bloquer le compte.
    if (!(await bcrypt.compare(password, user.password))) {
      await this.registerFailedAttempt(user);
    }

    // Une connexion réussie remet le compteur à zéro.
    if (user.failedLoginAttempts > 0) {
      await this.usersRepository.update(user.id, { failedLoginAttempts: 0 });
    }

    // Un token est émis pour cet appareil.
    const token = await this.accessTokensService.create(user.id);

    await this.journalisationsService.create(
      JournalisationModule.AUTHENTIFICATION,
      // La connexion est tracée dans le journal.
      `${user.fullName ?? user.email} vient de se connecter au système`,
      user,
    );

    // Le mot de passe et le compteur, lus pour la vérification, ne repartent jamais.
    const {
      password: _password,
      failedLoginAttempts: _failedLoginAttempts,
      ...profile
    } = user;

    // Le token n'est visible qu'ici : il ne pourra plus être relu ensuite.
    return {
      token: token.value,
      expiresAt: token.expiresAt,
      user: profile,
    };
  }

  /**
   * Révoque le token de l'appareil courant.
   */
  async logout(user: User, accessTokenId: string) {
    await this.journalisationsService.create(
      JournalisationModule.AUTHENTIFICATION,
      // La déconnexion est tracée dans le journal.
      `${user.fullName ?? user.email} vient de se déconnecter du système`,
      user,
    );

    // Seul le token de cet appareil est révoqué ; les autres restent connectés.
    await this.accessTokensService.delete(accessTokenId);
  }

  /**
   * Retrouve l'utilisateur d'un token, seulement si son compte est encore actif.
   */
  async findAuthenticatedUser(userId: string) {
    return this.usersRepository.findOne({
      // Un compte bloqué ou désactivé depuis l'émission du token n'est plus reconnu.
      where: { id: userId, status: UserStatus.ACTIVE },
    });
  }

  // Compte une erreur de mot de passe, bloque au seuil, puis refuse toujours la connexion.
  private async registerFailedAttempt(user: User): Promise<never> {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    // On incrémente avant de comparer pour bloquer exactement à la 3e erreur.
    const isBlocked = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;

    await this.usersRepository.update(user.id, {
      failedLoginAttempts,
      // Au seuil, le blocage est enregistré avec le compteur.
      ...(isBlocked ? { status: UserStatus.BLOCKED } : {}),
    });

    // Sous le seuil : simple refus, avec le message habituel.
    if (!isBlocked) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Un compte bloqué perd toutes ses connexions déjà ouvertes.
    await this.accessTokensService.deleteAllForUser(user.id);

    await this.journalisationsService.create(
      JournalisationModule.AUTHENTIFICATION,
      // Le blocage automatique est tracé dans le journal.
      `Le compte de ${user.fullName ?? user.email} a été automatiquement bloqué après ${MAX_FAILED_LOGIN_ATTEMPTS} tentatives de connexion échouées`,
      user,
    );

    throw new UnauthorizedException(
      'Compte bloqué après 3 tentatives de connexion échouées',
    );
  }
}
