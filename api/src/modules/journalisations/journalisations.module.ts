import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journalisation } from './entities/journalisation.entity.js';
import { JournalisationsController } from './journalisations.controller.js';
import { JournalisationsService } from './journalisations.service.js';

// Disponible partout : chaque domaine trace ses actions dans le journal, que la direction consulte.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Journalisation])],
  controllers: [JournalisationsController],
  providers: [JournalisationsService],
  exports: [JournalisationsService],
})
export class JournalisationsModule {}
