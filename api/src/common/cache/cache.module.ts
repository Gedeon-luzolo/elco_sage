import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from './cache.interceptor.js';
import { CacheService } from './cache.service.js';

// Les routes déclarent leur cache par décorateurs ; l'intercepteur global les applique.
@Global()
@Module({
  providers: [
    CacheService,
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
  exports: [CacheService],
})
export class CacheModule {}
