import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  catchError,
  concatMap,
  from,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { CacheService } from './cache.service.js';
import {
  CACHE_INVALIDATE_METADATA,
  CACHEABLE_METADATA,
  type CacheableOptions,
  type CacheInvalidateOptions,
} from './decorators/cache.decorators.js';

/**
 * Intercepteur global : applique @Cacheable et @CacheInvalidate posés sur les routes.
 * Les guards passent avant lui : une réponse en cache n'est jamais servie sans authentification.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const handler = context.getHandler();
    const cacheable = this.reflector.get<CacheableOptions>(
      CACHEABLE_METADATA,
      handler,
    );
    const invalidate = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_METADATA,
      handler,
    );

    // Seuls les paramètres de route puis de requête servent à construire les clés.
    const request = context.switchToHttp().getRequest<Request>();
    const args = [
      ...Object.values(request.params ?? {}),
      ...Object.values(request.query ?? {}),
    ];

    if (cacheable) {
      const key = this.cacheService.resolveKey(cacheable.key, args);

      return from(this.cacheService.get(key)).pipe(
        switchMap((cached) =>
          cached !== null
            ? of(cached)
            : next.handle().pipe(
                // La valeur est stockée avant de répondre : la prochaine lecture la trouve.
                concatMap(async (result) => {
                  if (result !== undefined && result !== null) {
                    await this.cacheService.set(key, result, cacheable.ttl);
                  }
                  return result;
                }),
              ),
        ),
      );
    }

    if (invalidate) {
      const patterns = invalidate.patterns.map((pattern) =>
        this.cacheService.resolveKey(pattern, args),
      );
      const clear = () => from(this.cacheService.invalidateByPattern(patterns));

      return next.handle().pipe(
        // Le cache est vidé avant que la réponse parte : le client relit des données fraîches.
        concatMap((result) => clear().pipe(map(() => result))),
        // Une écriture refusée peut avoir changé l'état (ex : compte bloqué) : on vide aussi.
        catchError((error: unknown) =>
          clear().pipe(switchMap(() => throwError(() => error))),
        ),
      );
    }

    return next.handle();
  }
}
