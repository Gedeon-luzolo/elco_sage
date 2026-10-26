import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CacheInvalidate } from '../../common/cache/decorators/cache.decorators.js';
import type { User } from '../users/entities/user.entity.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthGuard } from './guards/auth.guard.js';
import { AuthService } from './services/auth.service.js';
import type { AuthenticatedRequest } from './types/authenticated-request.type.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Connexion : seule route publique de l'API.
   */
  @Post('login')
  @HttpCode(200)
  @CacheInvalidate({ patterns: ['users:'] })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * Utilisateur du token courant (hydratation de la SPA au démarrage).
   */
  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: User) {
    return { user };
  }

  /**
   * Révoque le token de l'appareil courant.
   */
  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Req() request: AuthenticatedRequest,
  ) {
    // AuthGuard a retenu le token utilisé : c'est lui qui est révoqué.
    await this.authService.logout(user, request.accessTokenId!);
  }
}
