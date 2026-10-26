import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokensService } from '../services/access-tokens.service.js';
import { AuthService } from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';

const UNAUTHORIZED = 'Session expirée ou invalide. Reconnectez-vous.';

// Protège une route par token Bearer. Un 401 JSON laisse la SPA décider (connexion, file hors ligne).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly accessTokensService: AccessTokensService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Le token arrive dans l'en-tête « Authorization: Bearer <token> ».
    const [scheme, value] = (request.headers.authorization ?? '').split(' ');

    if (scheme !== 'Bearer' || !value) {
      throw new UnauthorizedException(UNAUTHORIZED);
    }

    // Le token doit exister dans Redis et correspondre à son empreinte.
    const token = await this.accessTokensService.verify(value);

    if (!token) {
      throw new UnauthorizedException(UNAUTHORIZED);
    }

    // Le compte a pu être désactivé depuis l'émission du token : on revérifie en base.
    const user = await this.authService.findAuthenticatedUser(token.userId);

    if (!user) {
      // Le token d'un compte qui n'est plus valide est supprimé tout de suite.
      await this.accessTokensService.delete(token.identifier);
      throw new UnauthorizedException(UNAUTHORIZED);
    }

    // Rendus disponibles aux contrôleurs via @CurrentUser() et pour la déconnexion.
    request.user = user;
    request.accessTokenId = token.identifier;
    return true;
  }
}
