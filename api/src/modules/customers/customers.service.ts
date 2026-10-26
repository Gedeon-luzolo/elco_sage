import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalisationModule } from '../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../journalisations/journalisations.service.js';
import type { User } from '../users/entities/user.entity.js';
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/create-update-customer.dto.js';
import { Customer } from './entities/customer.entity.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Tous les clients, du plus récent au plus ancien, avec leurs compteurs.
   */
  async getOverview() {
    // Toute la table est renvoyée, sans pagination.
    const customers = await this.customersRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Les compteurs se calculent sur la liste déjà chargée.
    const total = customers.length;
    const activeCount = customers.filter(
      (customer) => customer.isActive,
    ).length;

    return {
      customers,
      stats: { total, activeCount, inactiveCount: total - activeCount },
    };
  }

  /**
   * Clients actifs, sélectionnables dans une vente.
   */
  async getActiveCustomersForSale() {
    return this.customersRepository.find({
      // Un client désactivé ne peut plus être choisi sur un ticket.
      where: { isActive: true },
      order: { fullName: 'ASC' },
    });
  }

  /**
   * Crée un client, toujours actif.
   */
  async create(actor: User, dto: CreateCustomerDto) {
    // Ni le nom ni l'email ne doivent déjà appartenir à un autre client.
    await this.ensureIdentityAvailable(dto.fullName, dto.email);

    // Un nouveau client est toujours actif.
    const customer = await this.customersRepository.save(
      this.customersRepository.create({
        fullName: dto.fullName,
        customerType: dto.customerType,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        isActive: true,
      }),
    );

    await this.journalisationsService.create(
      JournalisationModule.CUSTOMERS,
      // La création est tracée dans le journal.
      `Le client "${customer.fullName}" a été créé par ${actor.fullName ?? actor.email}.`,
      actor,
    );

    return customer;
  }

  /**
   * Modifie les informations et le statut d'un client.
   */
  async update(actor: User, id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOrFail(id);

    // Seuls le nom et l'email qui changent réellement sont revérifiés.
    const nameChanged = dto.fullName !== customer.fullName;
    const emailChanged = dto.email !== null && dto.email !== customer.email;

    if (nameChanged || emailChanged) {
      await this.ensureIdentityAvailable(
        nameChanged ? dto.fullName : null,
        emailChanged ? dto.email : null,
        id,
      );
    }

    // Tous les champs sont toujours envoyés par le formulaire d'édition.
    await this.customersRepository.update(id, {
      fullName: dto.fullName,
      customerType: dto.customerType,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      isActive: dto.isActive,
    });

    await this.journalisationsService.create(
      JournalisationModule.CUSTOMERS,
      // La modification est tracée dans le journal, sous l'ancien nom.
      `Le client "${customer.fullName}" a été mis à jour par ${actor.fullName ?? actor.email}.`,
      actor,
    );
  }

  private async findOrFail(id: string) {
    // Un id inconnu répond 404 plutôt qu'une erreur SQL.
    const customer = await this.customersRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Client introuvable.');
    }

    return customer;
  }

  private async ensureIdentityAvailable(
    fullName: string | null,
    email: string | null,
    ignoredId?: string,
  ) {
    // Rien à vérifier si ni le nom ni l'email ne sont fournis.
    if (!fullName && !email) return;

    // Une seule requête couvre les deux doublons possibles.
    const query = this.customersRepository
      .createQueryBuilder('customer')
      .select(['customer.fullName', 'customer.email'])
      .where(
        // Chaque condition n'est active que si sa valeur est fournie.
        '((:fullName::varchar is not null and customer.full_name = :fullName) or (:email::varchar is not null and customer.email = :email))',
        { fullName, email },
      );

    // En modification, le client lui-même est ignoré.
    if (ignoredId) {
      query.andWhere('customer.id <> :ignoredId', { ignoredId });
    }

    const existing = await query.getOne();

    if (!existing) return;

    // Le nom est signalé en priorité, comme dans le formulaire.
    if (fullName && existing.fullName === fullName) {
      throw new UnprocessableEntityException(
        'Un client portant ce nom existe déjà.',
      );
    }

    throw new UnprocessableEntityException(
      'Cet email est déjà utilisé par un autre client.',
    );
  }
}
