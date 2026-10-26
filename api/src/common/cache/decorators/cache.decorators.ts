import { SetMetadata } from '@nestjs/common';
import type { CacheTtl } from '../enum/cache-ttl.enum.js';

export const CACHEABLE_METADATA = 'cache:cacheable';
export const CACHE_INVALIDATE_METADATA = 'cache:invalidate';

export interface CacheableOptions {
  key: string;
  ttl: CacheTtl | number;
}

export interface CacheInvalidateOptions {
  patterns: string[];
}

/**
 * Met en cache la réponse d'une route de lecture.
 * {0}, {1}… dans la clé sont remplacés par les paramètres de route puis de requête.
 */
export const Cacheable = (options: CacheableOptions) =>
  SetMetadata(CACHEABLE_METADATA, options);

/**
 * Vide les clés commençant par ces préfixes après une écriture.
 */
export const CacheInvalidate = (options: CacheInvalidateOptions) =>
  SetMetadata(CACHE_INVALIDATE_METADATA, options);
