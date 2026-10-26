import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '../../users/entities/user.entity.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.type.js';

// Doit être utilisé derrière AuthGuard, qui attache request.user.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);
