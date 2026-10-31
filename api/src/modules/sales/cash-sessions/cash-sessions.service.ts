import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
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
  userSummaryFields,
} from '../../users/utils/user.utils.js';
import { SalePaymentType, SaleStatus } from '../sales/enums/sale.enums.js';
import type { CloseCashSessionDto } from './dto/close-cash-session.dto.js';
import { CashSession } from './entities/cash-session.entity.js';
import { CashSessionStatus } from './enums/cash-session-status.enum.js';

// Verrou qui sérialise les ouvertures de caisse, libéré à la fin de la transaction.
const OPEN_SESSION_LOCK = `SELECT pg_advisory_xact_lock(hashtext('cash_sessions_open'))`;

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
   * Session ouverte, la même pour tous, ou null.
   */
  async getOpenSession() {
    // L'index unique partiel garantit qu'au plus une session est ouverte.
    return this.sessionQuery()
      .where('session.status = :open', { open: CashSessionStatus.OPEN })
      .getOne();
  }

  /**
   * Session ouverte, verrouillée en lecture jusqu'à la fin de la transaction, ou null.
   * Une clôture attend ainsi la fin de la vente ou du recouvrement qui l'utilise.
   */
  async lockOpenSession() {
    return this.cashSessionsRepository
      .createQueryBuilder('session')
      .where('session.status = :open', { open: CashSessionStatus.OPEN })
      .setLock('pessimistic_read')
      .getOne();
  }

  /**
   * Session ouverte, ou 404 : pour les routes qui n'ont de sens que caisse ouverte.
   */
  async getOpenSessionOrFail() {
    const session = await this.getOpenSession();

    if (!session) {
      throw new NotFoundException(NO_OPEN_SESSION_MESSAGE);
    }

    return session;
  }

  /**
   * Une session avec ses utilisateurs, ou 404.
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
   * Sessions de la plus récente à la plus ancienne. La caisse est partagée : tout le monde les voit.
   */
  async findSessions({ startDate, endDate }: PeriodDto) {
    const query = this.sessionQuery().orderBy('session.openedAt', 'DESC');

    // La période couvre les journées complètes sélectionnées.
    if (startDate && endDate) {
      const { start, end } = dayRange(startDate, endDate);
      query.where('session.opened_at BETWEEN :start AND :end', { start, end });
    }

    return query.getMany();
  }

  /**
   * Ouvre la session de caisse et réserve une première plage de numéros à celui qui l'ouvre.
   */
  @Transactional()
  async open(actor: User) {
    // Deux ouvertures simultanées passent l'une après l'autre : la seconde voit la première.
    await this.cashSessionsRepository.query(OPEN_SESSION_LOCK);

    // Une seule session ouverte à la fois : on dit qui l'a ouverte et depuis quand.
    const existing = await this.getOpenSession();
    if (existing) {
      throw new UnprocessableEntityException(
        `Une session de caisse est déjà ouverte par ${getUserDisplayName(existing.openedBy) ?? 'un utilisateur'} depuis le ${toDateTimeLabel(existing.openedAt)}. Fermez-la avant d'en ouvrir une nouvelle.`,
      );
    }

    // La date d'ouverture vient du serveur pour rester fiable.
    const session = await this.cashSessionsRepository.save(
      this.cashSessionsRepository.create({
        openedById: actor.id,
        closedById: null,
        status: CashSessionStatus.OPEN,
        openedAt: new Date(),
        closedAt: null,
        systemAmounts: null,
        closingAmounts: null,
        differenceAmounts: null,
      }),
    );

    await this.journalisationsService.create(
      JournalisationModule.SALES,
      // L'ouverture est tracée dans le journal.
      `Session de caisse ouverte par ${getUserDisplayName(actor)}.`,
      actor,
    );

    return this.findOneOrFail(session.id);
  }

  /**
   * Clôture la session ouverte : n'importe quel utilisateur peut le faire.
   */
  @Transactional()
  async close(actor: User, dto: CloseCashSessionDto) {
    // La ligne est verrouillée : une vente en cours se termine avant, une vente suivante voit la session fermée.
    const session = await this.cashSessionsRepository
      .createQueryBuilder('session')
      .where('session.status = :open', { open: CashSessionStatus.OPEN })
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
      closedById: actor.id,
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

  // Session avec celui qui l'a ouverte et celui qui l'a fermée, réduits à leur nom.
  private sessionQuery() {
    return this.cashSessionsRepository
      .createQueryBuilder('session')
      .leftJoin('session.openedBy', 'openedBy')
      .leftJoin('session.closedBy', 'closedBy')
      .addSelect([
        ...userSummaryFields('openedBy'),
        ...userSummaryFields('closedBy'),
      ]);
  }
}
