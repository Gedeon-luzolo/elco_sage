import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { ProductService } from '../../catalog/product-services/entities/product-service.entity.js';
import { ProductServiceType } from '../../catalog/product-services/enums/product-service-type.enum.js';
import { Customer } from '../../customers/entities/customer.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { UserRole, UserStatus } from '../../users/enums/user.enums.js';
import { CashSession } from '../cash-sessions/entities/cash-session.entity.js';
import { CashSessionStatus } from '../cash-sessions/enums/cash-session-status.enum.js';
import type { CreateSaleDto } from './dto/create-sale.dto.js';
import type { Sale } from './entities/sale.entity.js';
import { SalePaymentType } from './enums/sale.enums.js';

@Injectable()
export class SaleValidationService {
  constructor(
    @InjectRepository(CashSession)
    private readonly cashSessionsRepository: Repository<CashSession>,
    @InjectRepository(ProductService)
    private readonly productServicesRepository: Repository<ProductService>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Vérifie toutes les règles d'une nouvelle vente avant son enregistrement.
   * Renvoie la session à utiliser et les services vendus, indexés par id.
   */
  async validateCreateSale(dto: CreateSaleDto) {
    // La caisse est verrouillée en lecture : une clôture attend la fin de cette vente.
    const cashSession = await this.resolveCashSession(dto);

    await this.ensureCustomerRules(dto);
    await this.ensureOperatorIsValid(dto.operatorId);

    // Les prix seront relus sur ces services, jamais pris chez le client.
    const services = await this.findSellableServices(dto);

    return { cashSession, services };
  }

  /**
   * La remise vient du montant à payer saisi et ne peut jamais dépasser le brut.
   */
  ensureDiscountWithinTotal(discountAmount: number, theoreticalAmount: number) {
    if (discountAmount > theoreticalAmount) {
      throw new UnprocessableEntityException(
        'La remise ne peut pas dépasser le total de la vente.',
      );
    }
  }

  /**
   * Une fois la caisse fermée, l'addition est figée dans le rapport de clôture.
   */
  async ensureCanBeCancelled(sale: Sale) {
    const cashSession = await this.cashSessionsRepository.findOneOrFail({
      select: { id: true, status: true },
      where: { id: sale.cashSessionId },
    });

    if (cashSession.status === CashSessionStatus.CLOSED) {
      throw new UnprocessableEntityException(
        "Impossible d'annuler une vente dont la session de caisse est fermée.",
      );
    }
  }

  // Session sur laquelle la vente est enregistrée, verrouillée en lecture jusqu'à la fin de la transaction.
  private async resolveCashSession(dto: CreateSaleDto) {
    const query = this.cashSessionsRepository
      .createQueryBuilder('session')
      .setLock('pessimistic_read');

    // Le client indique la caisse sur laquelle il a vendu : c'est la seule façon de rattacher
    // une vente hors ligne à la bonne caisse si une autre a été ouverte depuis.
    if (dto.cashSessionId) {
      const session = await query
        .where('session.id = :id', { id: dto.cashSessionId })
        .getOne();

      if (!session) {
        throw new UnprocessableEntityException(
          'La session de caisse sélectionnée est invalide.',
        );
      }

      // Une vente faite pendant la session mais reçue après sa clôture reste acceptée :
      // elle a déjà été encaissée et son ticket imprimé.
      if (
        session.status === CashSessionStatus.OPEN ||
        this.wasSoldDuringSession(session, dto.saleDate)
      ) {
        return session;
      }

      throw new UnprocessableEntityException(
        'La session de caisse est fermée. Ouvrez une nouvelle session pour vendre.',
      );
    }

    // Sans caisse indiquée, la vente va sur la session ouverte.
    const openSession = await query
      .where('session.status = :open', { open: CashSessionStatus.OPEN })
      .getOne();

    if (!openSession) {
      throw new UnprocessableEntityException(
        'Ouvrez une session de caisse avant de créer une vente.',
      );
    }

    return openSession;
  }

  // Vrai si la date de vente tombe entre l'ouverture et la clôture de la session.
  private wasSoldDuringSession(session: CashSession, saleDate: string | null) {
    if (!saleDate || !session.closedAt) {
      return false;
    }

    const soldAt = new Date(saleDate);

    return soldAt >= session.openedAt && soldAt <= session.closedAt;
  }

  // Le client est obligatoire pour tracer les crédits, les offerts et les remises ; s'il est donné, il doit être actif.
  private async ensureCustomerRules(dto: CreateSaleDto) {
    const requiresCustomer =
      dto.paymentType === SalePaymentType.CREDIT ||
      dto.paymentType === SalePaymentType.OFFERED ||
      (dto.discountAmount ?? 0) > 0;

    if (requiresCustomer && !dto.customerId) {
      throw new UnprocessableEntityException(
        'Sélectionnez un client pour une vente à crédit, offerte ou avec remise.',
      );
    }

    // Sans client, il n'y a rien d'autre à vérifier.
    if (!dto.customerId) {
      return;
    }

    const isActive = await this.customersRepository.exists({
      where: { id: dto.customerId, isActive: true },
    });

    if (!isActive) {
      throw new UnprocessableEntityException(
        'Le client sélectionné est invalide ou inactif.',
      );
    }
  }

  // Tout utilisateur actif peut être opérateur de la commande, sauf l'administrateur.
  private async ensureOperatorIsValid(operatorId: string) {
    const isValid = await this.usersRepository.exists({
      where: {
        id: operatorId,
        role: Not(UserRole.ADMIN),
        status: UserStatus.ACTIVE,
      },
    });

    if (!isValid) {
      throw new UnprocessableEntityException(
        "L'opérateur sélectionné est invalide ou inactif.",
      );
    }
  }

  // Services vendus, chacun une seule fois et tous actifs, indexés par id.
  private async findSellableServices(dto: CreateSaleDto) {
    const serviceIds = dto.items.map((item) => item.productServiceId);

    // Un service ne figure qu'une fois par vente.
    if (new Set(serviceIds).size !== serviceIds.length) {
      throw new UnprocessableEntityException(
        'Un service ne peut pas être ajouté plusieurs fois dans la même vente.',
      );
    }

    // Seuls les services actifs se vendent ; les produits en stock ne passent pas à la caisse.
    const services = await this.productServicesRepository.find({
      where: {
        id: In(serviceIds),
        type: ProductServiceType.SERVICE,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new UnprocessableEntityException(
        'Un ou plusieurs services sélectionnés sont invalides ou inactifs.',
      );
    }

    return new Map(services.map((service) => [service.id, service]));
  }
}
