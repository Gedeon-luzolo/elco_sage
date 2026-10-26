import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service.js';

// Disponible partout : chaque domaine met en cache et invalide ses propres clés.
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
