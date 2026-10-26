import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../../auth/guards/auth.guard.js';
import type { User } from '../../users/entities/user.entity.js';
import { AdditionNumbersService } from '../addition-numbers/addition-numbers.service.js';
import { CashSessionsService } from './cash-sessions.service.js';
import { CloseCashSessionDto } from './dto/close-cash-session.dto.js';
import { FindCashSessionsDto } from './dto/find-cash-sessions.dto.js';
import { toCashSessionResponse } from './utils/cash-session.utils.js';

// La caisse est partagée : tout utilisateur connecté l'ouvre, y vend et la clôture.
@Controller('cash-sessions')
@UseGuards(AuthGuard)
export class CashSessionsController {
  constructor(
    private readonly cashSessionsService: CashSessionsService,
    private readonly additionNumbersService: AdditionNumbersService,
  ) {}

  /**
   * Sessions de caisse, filtrables par période.
   */
  @Get()
  async findAll(@Query() query: FindCashSessionsDto) {
    const sessions = await this.cashSessionsService.findSessions(query);

    return sessions.map(toCashSessionResponse);
  }

  /**
   * Session ouverte ou null : la SPA en déduit si la vente est possible.
   */
  @Get('current')
  async findCurrent() {
    const session = await this.cashSessionsService.getOpenSession();

    return session ? toCashSessionResponse(session) : null;
  }

  /**
   * Montants attendus, affichés dans le dialogue de clôture.
   */
  @Get('current/system-amounts')
  async findSystemAmounts() {
    const session = await this.cashSessionsService.getOpenSessionOrFail();

    return {
      systemAmounts: await this.cashSessionsService.computeSystemAmounts(
        session.id,
      ),
    };
  }

  /**
   * Plages de numéros réservées à l'utilisateur et dernier numéro utilisé.
   */
  @Get('current/addition-numbers')
  async findAdditionNumbers(@CurrentUser() actor: User) {
    const session = await this.cashSessionsService.getOpenSessionOrFail();

    return this.additionNumbersService.getState(session.id, actor.id);
  }

  /**
   * Réserve une nouvelle plage quand la précédente est presque consommée.
   */
  @Post('current/addition-numbers')
  async reserveAdditionNumbers(@CurrentUser() actor: User) {
    const session = await this.cashSessionsService.getOpenSessionOrFail();

    // Nouvelle plage, puis état complet renvoyé au client.
    await this.additionNumbersService.reserveBlock(session.id, actor.id);

    return this.additionNumbersService.getState(session.id, actor.id);
  }

  /**
   * Clôture la session ouverte.
   */
  @Post('close')
  @HttpCode(200)
  async close(@CurrentUser() actor: User, @Body() dto: CloseCashSessionDto) {
    return toCashSessionResponse(
      await this.cashSessionsService.close(actor, dto),
    );
  }

  /**
   * Ouvre la session de caisse, avec la première plage de numéros de celui qui l'ouvre.
   */
  @Post()
  async open(@CurrentUser() actor: User) {
    const session = await this.cashSessionsService.open(actor);

    return {
      session: toCashSessionResponse(session),
      additionNumbers: await this.additionNumbersService.getState(
        session.id,
        actor.id,
      ),
    };
  }
}
