import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import { DebtsService } from './debts.service.js';
import { FindDebtsDto } from './dto/find-debts.dto.js';

@Controller('debts')
@UseGuards(AuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  /**
   * Ventes à crédit avec leur reste à payer ; les dettes soldées seulement avec includePaid=true.
   */
  @Get()
  findAll(@Query() query: FindDebtsDto) {
    return this.debtsService.getOverview(query);
  }
}
