import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module.js';
import { CustomersModule } from '../customers/customers.module.js';
import { ProformaItem } from './entities/proforma-item.entity.js';
import { Proforma } from './entities/proforma.entity.js';
import { ProformasController } from './proformas.controller.js';
import { ProformasService } from './proformas.service.js';

// Proformas : devis numérotés, sans caisse ni paiement, convertibles en vente.
@Module({
  imports: [
    TypeOrmModule.forFeature([Proforma, ProformaItem]),
    CatalogModule,
    CustomersModule,
  ],
  controllers: [ProformasController],
  providers: [ProformasService],
  exports: [ProformasService],
})
export class ProformasModule {}
