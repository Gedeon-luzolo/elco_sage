import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UuidParam } from '../../common/decorators/uuid-param.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import type { User } from '../users/entities/user.entity.js';
import { CreateUpdateProformaDto } from './dto/create-update-proforma.dto.js';
import { FindProformasDto } from './dto/find-proformas.dto.js';
import { ProformasService } from './proformas.service.js';

// Tous les vendeurs émettent, modifient et annulent les proformas.
@Controller('proformas')
@UseGuards(AuthGuard)
export class ProformasController {
  constructor(private readonly proformasService: ProformasService) {}

  /**
   * Liste des proformas par lot, filtrable par numéro, client et statut.
   */
  @Get()
  findAll(@Query() query: FindProformasDto) {
    return this.proformasService.findAll(query);
  }

  /**
   * Émet une proforma.
   */
  @Post()
  create(@CurrentUser() actor: User, @Body() dto: CreateUpdateProformaDto) {
    return this.proformasService.create(actor, dto);
  }

  /**
   * Remplace le contenu d'une proforma encore émise.
   */
  @Patch(':id')
  update(
    @CurrentUser() actor: User,
    @UuidParam() id: string,
    @Body() dto: CreateUpdateProformaDto,
  ) {
    return this.proformasService.update(actor, id, dto);
  }

  /**
   * Annule une proforma encore émise.
   */
  @Patch(':id/cancel')
  cancel(@CurrentUser() actor: User, @UuidParam() id: string) {
    return this.proformasService.cancel(actor, id);
  }
}
