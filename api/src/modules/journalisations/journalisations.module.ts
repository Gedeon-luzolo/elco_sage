import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journalisation } from './entities/journalisation.entity.js';
import { JournalisationsService } from './journalisations.service.js';

// Disponible partout : chaque domaine trace ses actions dans le journal.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Journalisation])],
  providers: [JournalisationsService],
  exports: [JournalisationsService],
})
export class JournalisationsModule {}
