import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

/**
 * Enveloppe toute réponse réussie dans { data }, le contrat lu par la SPA.
 * « Pas de donnée » reste un { data: null } (ex : aucune session ouverte).
 */
@Injectable()
export class DataEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((data) => ({ data: data ?? null })));
  }
}
