import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { ManagementGuard } from '../auth/guards/management.guard.js';
import { FindJournalisationsDto } from './dto/find-journalisations.dto.js';
import { JournalisationsService } from './journalisations.service.js';

// Journal d'audit : réservé à la direction.
@Controller('journalisations')
@UseGuards(AuthGuard, ManagementGuard)
export class JournalisationsController {
  constructor(
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Journal des actions par lot, filtrable par module et par période.
   */
  @Get()
  findBatch(@Query() query: FindJournalisationsDto) {
    return this.journalisationsService.findBatch(query);
  }
}
