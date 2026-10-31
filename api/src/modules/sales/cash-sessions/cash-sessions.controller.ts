import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PeriodDto } from '../../../common/dto/period.dto.js';
import { UuidParam } from '../../../common/decorators/uuid-param.decorator.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import type { User } from '../../users/entities/user.entity.js';
import { CashSessionReportService } from './cash-session-report.service.js';
import { CashSessionsService } from './cash-sessions.service.js';
import { CloseCashSessionDto } from './dto/close-cash-session.dto.js';

// Chaque vendeur a sa caisse : il l'ouvre, y vend et la clôture. La direction voit toutes les sessions.
@Controller('cash-sessions')
@UseGuards(AuthGuard)
export class CashSessionsController {
  constructor(
    private readonly cashSessionsService: CashSessionsService,
    private readonly cashSessionReportService: CashSessionReportService,
  ) {}

  /**
   * Sessions de caisse visibles par l'utilisateur, filtrables par période.
   */
  @Get()
  findAll(@CurrentUser() actor: User, @Query() query: PeriodDto) {
    return this.cashSessionsService.findSessions(actor, query);
  }

  /**
   * Session ouverte de l'utilisateur ou null : la SPA en déduit si la vente est possible.
   */
  @Get('current')
  findCurrent(@CurrentUser() actor: User) {
    return this.cashSessionsService.getOpenSession(actor.id);
  }

  /**
   * Montants attendus, affichés dans le dialogue de clôture.
   */
  @Get('current/system-amounts')
  async findSystemAmounts(@CurrentUser() actor: User) {
    const session = await this.cashSessionsService.getOpenSessionOrFail(
      actor.id,
    );

    return {
      systemAmounts: await this.cashSessionsService.computeSystemAmounts(
        session.id,
      ),
    };
  }

  /**
   * Clôture la session ouverte.
   */
  @Post('close')
  @HttpCode(200)
  close(@CurrentUser() actor: User, @Body() dto: CloseCashSessionDto) {
    return this.cashSessionsService.close(actor, dto);
  }

  /**
   * Ouvre la session de caisse.
   */
  @Post()
  async open(@CurrentUser() actor: User) {
    return { session: await this.cashSessionsService.open(actor) };
  }

  /**
   * Rapport d'une session : ventes actives et totaux. Déclarée après les routes fixes (current, close).
   */
  @Get(':id')
  findReport(@CurrentUser() actor: User, @UuidParam() id: string) {
    return this.cashSessionReportService.getReport(actor, id);
  }
}
