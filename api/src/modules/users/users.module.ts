import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperatorsController } from './controllers/operators.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './services/users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, OperatorsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
