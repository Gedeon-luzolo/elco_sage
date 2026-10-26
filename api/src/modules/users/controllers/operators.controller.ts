import { Controller, Get, UseGuards } from '@nestjs/common';
import { Cacheable } from '../../../common/cache/decorators/cache.decorators.js';
import { CacheTtl } from '../../../common/cache/enum/cache-ttl.enum.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { UsersService } from '../services/users.service.js';

@Controller('operators')
@UseGuards(AuthGuard)
export class OperatorsController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Opérateurs sélectionnables sur une vente (donnée de référence hors ligne).
   */
  @Get()
  @Cacheable({ key: 'users:operators', ttl: CacheTtl.ONE_MONTH })
  findActive() {
    return this.usersService.getActiveOperatorsForSale();
  }
}
