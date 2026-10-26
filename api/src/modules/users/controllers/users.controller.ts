import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CacheInvalidate,
  Cacheable,
} from '../../../common/cache/decorators/cache.decorators.js';
import { CacheTtl } from '../../../common/cache/enum/cache-ttl.enum.js';
import { UuidParam } from '../../../common/decorators/uuid-param.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { ManagementGuard } from '../../auth/guards/management.guard.js';
import { CreateUserDto, UpdateUserDto } from '../dto/create-update-user.dto.js';
import type { User } from '../entities/user.entity.js';
import { UsersService } from '../services/users.service.js';

// Gestion des comptes : réservée à la direction.
@Controller('users')
@UseGuards(AuthGuard, ManagementGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Comptes récents avec statistiques et répartition par statut.
   */
  @Get()
  @Cacheable({ key: 'users:overview', ttl: CacheTtl.ONE_MONTH })
  findAll() {
    return this.usersService.getOverview(30);
  }

  /**
   * Crée un compte et renvoie le mot de passe initial à communiquer.
   */
  @Post()
  @CacheInvalidate({ patterns: ['users:'] })
  create(@CurrentUser() actor: User, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(actor, createUserDto);
  }

  /**
   * Modifie un compte.
   */
  @Patch(':id')
  @HttpCode(204)
  @CacheInvalidate({ patterns: ['users:'] })
  async update(
    @CurrentUser() actor: User,
    @UuidParam() id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    await this.usersService.update(actor, id, updateUserDto);
  }

  /**
   * Supprime un compte (jamais soi-même).
   */
  @Delete(':id')
  @HttpCode(204)
  @CacheInvalidate({ patterns: ['users:'] })
  async delete(@CurrentUser() actor: User, @UuidParam() id: string) {
    await this.usersService.delete(actor, id);
  }
}
