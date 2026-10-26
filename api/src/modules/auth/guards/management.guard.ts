import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { isManagementRole } from '../../users/utils/user.utils.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';

// Réserve une route à la direction. À placer après AuthGuard, qui attache l'utilisateur.
@Injectable()
export class ManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // L'utilisateur a été attaché par AuthGuard, qui passe avant.
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user || !isManagementRole(user.role)) {
      throw new ForbiddenException('Accès réservé à la direction.');
    }

    return true;
  }
}
