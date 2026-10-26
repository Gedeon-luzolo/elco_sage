import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from '../catalog/product-services/entities/product-service.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AdditionNumbersService } from './addition-numbers/addition-numbers.service.js';
import { AdditionNumberBlock } from './addition-numbers/entities/addition-number-block.entity.js';
import { CashSessionsController } from './cash-sessions/cash-sessions.controller.js';
import { CashSessionsService } from './cash-sessions/cash-sessions.service.js';
import { CashSession } from './cash-sessions/entities/cash-session.entity.js';
import { SaleRecovery } from './recoveries/entities/sale-recovery.entity.js';
import { SaleItem } from './sales/entities/sale-item.entity.js';
import { Sale } from './sales/entities/sale.entity.js';
import { SalesController } from './sales/sales.controller.js';
import { SaleValidationService } from './sales/sale-validation.service.js';
import { SalesService } from './sales/sales.service.js';

// Caisse : sessions, numérotation des additions et ventes.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashSession,
      AdditionNumberBlock,
      Sale,
      SaleItem,
      SaleRecovery,
      ProductService,
      Customer,
      User,
    ]),
  ],
  controllers: [CashSessionsController, SalesController],
  providers: [
    CashSessionsService,
    AdditionNumbersService,
    SaleValidationService,
    SalesService,
  ],
})
export class SalesModule {}
