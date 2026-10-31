import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { isUniqueViolation } from '../../../common/database/database-error.utils.js';
import type { PeriodDto } from '../../../common/dto/period.dto.js';
import { Currency } from '../../../common/enums/currency.enum.js';
import type { MoneyMap } from '../../../common/types/money-map.type.js';
import { dayRange, toDateTimeLabel } from '../../../common/utils/date.utils.js';
import {
  buildDifferenceMoneyMap,
  buildMoneyMap,
  normalizeMoneyMap,
} from '../../../common/utils/money-map.utils.js';
import { JournalisationModule } from '../../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../../journalisations/journalisations.service.js';
import type { User } from '../../users/entities/user.entity.js';
import {
  getUserDisplayName,
  isManagementRole,
  userSummaryFields,
} from '../../users/utils/user.utils.js';
import { SalePaymentType, SaleStatus } from '../sales/enums/sale.enums.js';
import type { CloseCashSessionDto } from './dto/close-cash-session.dto.js';
import { CashSession } from './entities/cash-session.entity.js';
import { CashSessionStatus } from './enums/cash-session-status.enum.js';

export const NO_OPEN_SESSION_MESSAGE =
  "Aucune session de caisse ouverte n'a été trouvée.";

type CurrencyTotalRow = { currency: Currency; total: string };

@Injectable()
export class CashSessionsService {
  constructor(
    @InjectRepository(CashSession)
    private readonly cashSessionsRepository: Repository<CashSession>,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Session ouverte de l'utilisateur, ou null.
   */
  async getOpenSession(userId: string) {
    // L'index unique partiel garantit qu'un utilisateur a au plus une session ouverte.
    return this.sessionQuery()
      .where('session.user_id = :userId', { userId })
      .andWhere('session.status = :open', { open: CashSessionStatus.OPEN })
      .getOne();
  }

  /**
   * Session ouverte de l'utilisateur, verrouillée en lecture jusqu'à la fin de la transaction, ou null.
   * Une clôture attend ainsi la fin de la vente ou du recouvrement qui l'utilise.
   */
  async lockOpenSession(userId: string) {
    return this.cashSessionsRepository
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.status = :open', { open: CashSessionStatus.OPEN })
      .setLock('pessimistic_read')
      .getOne();
  }

  /**
   * Session ouverte de l'utilisateur, ou 404 : pour les routes qui n'ont de sens que caisse ouverte.
   */
  async getOpenSessionOrFail(userId: string) {
    const session = await this.getOpenSession(userId);

    if (!session) {
      throw new NotFoundException(NO_OPEN_SESSION_MESSAGE);
    }

    return session;
  }

  /**
   * Une session avec son vendeur, ou 404.
   */
  async findOneOrFail(id: string) {
    const session = await this.sessionQuery()
      .where('session.id = :id', { id })
      .getOne();

    if (!session) {
      throw new NotFoundException('Session de caisse introuvable.');
    }

    return session;
  }

  /**
   * Une session lisible par l'utilisateur : la sienne, ou n'importe laquelle pour la direction.
   */
  async findVisibleOrFail(actor: User, id: string) {
    const session = await this.findOneOrFail(id);

    if (session.userId !== actor.id && !isManagementRole(actor.role)) {
      throw new ForbiddenException(
        'Cette session de caisse appartient à un autre vendeur.',
      );
    }

    return session;
  }

  /**
   * Sessions de la plus récente à la plus ancienne : toutes pour la direction, les siennes pour les autres.
   */
  async findSessions(actor: User, { startDate, endDate }: PeriodDto) {
    const query = this.sessionQuery().orderBy('session.openedAt', 'DESC');

    if (!isManagementRole(actor.role)) {
      query.andWhere('session.user_id = :userId', { userId: actor.id });
    }

    // La période couvre les journées complètes sélectionnées.
    if (startDate && endDate) {
      const { start, end } = dayRange(startDate, endDate);
      query.andWhere('session.opened_at BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    return query.getMany();
  }

  /**
   * Ouvre la session de caisse de l'utilisateur.
   */
  @Transactional()
  async open(actor: User) {
    // Une seule session ouverte par utilisateur : on lui rappelle depuis quand la sienne l'est.
    const existing = await this.getOpenSession(actor.id);
    if (existing) {
      throw this.alreadyOpenError(existing.openedAt);
    }

    // La date d'ouverture vient du serveur pour rester fiable.
    const session = await this.insertSession({
      userId: actor.id,
      status: CashSessionStatus.OPEN,
      openedAt: new Date(),
      closedAt: null,
      systemAmounts: null,
      closingAmounts: null,
      differenceAmounts: null,
    });

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // L'ouverture est tracée dans le journal.
      `Session de caisse ouverte par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findOneOrFail(session.id);
  }

  /**
   * Clôture la session ouverte de l'utilisateur : chacun ferme la sienne.
   */
  @Transactional()
  async close(actor: User, dto: CloseCashSessionDto) {
    // La ligne est verrouillée : une vente en cours se termine avant, une vente suivante voit la session fermée.
    const session = await this.cashSessionsRepository
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId: actor.id })
      .andWhere('session.status = :open', { open: CashSessionStatus.OPEN })
      .setLock('pessimistic_write')
      .getOne();

    if (!session) {
      throw new UnprocessableEntityException(NO_OPEN_SESSION_MESSAGE);
    }

    // La caisse peut être clôturée avec une seule devise, mais pas sans aucun montant.
    if (dto.closingAmountCdf === null && dto.closingAmountUsd === null) {
      throw new UnprocessableEntityException(
        'Saisissez au moins un montant de clôture.',
      );
    }

    // Le serveur recalcule toujours le théorique au moment de la clôture.
    const systemAmounts = await this.computeSystemAmounts(session.id);
    const closingAmounts = buildMoneyMap({
      [Currency.CDF]: dto.closingAmountCdf,
      [Currency.USD]: dto.closingAmountUsd,
    });
    const differenceAmounts = buildDifferenceMoneyMap(
      closingAmounts,
      systemAmounts,
    );

    // La clôture complète la session existante et fige ses montants.
    await this.cashSessionsRepository.update(session.id, {
      status: CashSessionStatus.CLOSED,
      closedAt: new Date(),
      systemAmounts,
      closingAmounts,
      differenceAmounts,
    });

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // La clôture et ses écarts sont tracés dans le journal.
      `Session de caisse fermée par ${getUserDisplayName(actor)}. Écart : ${JSON.stringify(differenceAmounts)}.`,
      actor,
    );

    return this.findOneOrFail(session.id);
  }

  /**
   * Argent attendu dans la caisse, par devise et sans conversion : ventes cash actives et recouvrements.
   */
  async computeSystemAmounts(cashSessionId: string): Promise<MoneyMap> {
    // Une seule requête additionne les deux sources d'encaissement de la session.
    const rows = await this.cashSessionsRepository.query<CurrencyTotalRow[]>(
      `SELECT currency, SUM(amount) AS total
       FROM (
         SELECT currency, total_amount AS amount
         FROM sales
         WHERE cash_session_id = $1 AND payment_type = $2 AND status = $3
         UNION ALL
         SELECT currency, amount
         FROM sale_recoveries
         WHERE cash_session_id = $1
       ) AS collected
       GROUP BY currency`,
      [cashSessionId, SalePaymentType.CASH, SaleStatus.ACTIVE],
    );

    // Une devise sans encaissement vaut 0 ; PostgreSQL renvoie les sommes en texte.
    return normalizeMoneyMap(
      Object.fromEntries(rows.map((row) => [row.currency, Number(row.total)])),
    );
  }

  // Session avec son vendeur, réduit à son nom.
  private sessionQuery() {
    return this.cashSessionsRepository
      .createQueryBuilder('session')
      .leftJoin('session.user', 'user')
      .addSelect(userSummaryFields('user'));
  }

  // Enregistre la session ; deux ouvertures simultanées du même utilisateur butent sur l'index unique.
  private async insertSession(fields: Partial<CashSession>) {
    try {
      return await this.cashSessionsRepository.save(
        this.cashSessionsRepository.create(fields),
      );
    } catch (error) {
      if (isUniqueViolation(error, 'cash_sessions_one_open_per_user')) {
        throw this.alreadyOpenError(null);
      }

      throw error;
    }
  }

  // Refus d'ouvrir une seconde session, avec l'heure d'ouverture de la première quand elle est connue.
  private alreadyOpenError(openedAt: Date | null) {
    const since = openedAt ? ` depuis le ${toDateTimeLabel(openedAt)}` : '';

    return new UnprocessableEntityException(
      `Votre session de caisse est déjà ouverte${since}. Fermez-la avant d'en ouvrir une nouvelle.`,
    );
  }
}
