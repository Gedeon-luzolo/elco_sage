import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './guards/auth.guard.js';
import { ManagementGuard } from './guards/management.guard.js';
import { AccessTokensService } from './services/access-tokens.service.js';
import { AuthService } from './services/auth.service.js';

// Global : chaque contrôleur protège ses routes avec @UseGuards(AuthGuard) sans réimporter le module.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [AuthService, AccessTokensService, AuthGuard, ManagementGuard],
  exports: [AuthService, AccessTokensService, AuthGuard, ManagementGuard],
})
export class AuthModule {}
