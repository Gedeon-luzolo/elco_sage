import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalisationModule } from '../journalisations/enums/journalisation-module.enum.js';
import { JournalisationsService } from '../journalisations/journalisations.service.js';
import type { User } from '../users/entities/user.entity.js';
import type { CreateExchangeRateDto } from './dto/create-exchange-rate.dto.js';
import { ExchangeRate } from './entities/exchange-rate.entity.js';

// Colonnes d'un taux renvoyées à la SPA.
const RATE_FIELDS = {
  id: true,
  exchangeRate: true,
  sellRate: true,
  createdAt: true,
} as const;

@Injectable()
export class ExchangeRatesService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRatesRepository: Repository<ExchangeRate>,
    private readonly journalisationsService: JournalisationsService,
  ) {}

  /**
   * Dernier taux encodé : c'est le taux courant.
   */
  async getCurrentRate() {
    // Le taux le plus récent fait foi.
    const [rate] = await this.exchangeRatesRepository.find({
      select: RATE_FIELDS,
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return rate ?? null;
  }

  /**
   * Derniers taux, du plus récent au plus ancien.
   */
  async getHistory(limit = 20) {
    // Du plus récent au plus ancien : le premier est le taux courant.
    return this.exchangeRatesRepository.find({
      select: RATE_FIELDS,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Ajoute un taux : l'historique est conservé et le dernier devient le taux courant.
   */
  async create(actor: User, dto: CreateExchangeRateDto) {
    // L'ancien taux est relu pour décrire le changement dans le journal.
    const previousRate = await this.getCurrentRate();

    // Un nouveau taux est une nouvelle ligne : l'historique est conservé.
    const rate = await this.exchangeRatesRepository.save(
      this.exchangeRatesRepository.create({
        exchangeRate: dto.exchangeRate,
        sellRate: dto.sellRate,
      }),
    );

    // Le journal indique l'ancien et le nouveau taux.
    const actorName = actor.fullName ?? actor.email;
    await this.journalisationsService.create(
      JournalisationModule.EXCHANGE_RATES,
      previousRate
        ? `Le taux USD/CDF a été mis à jour par ${actorName}. Taux de change : ${previousRate.exchangeRate} -> ${rate.exchangeRate}, Vente : ${previousRate.sellRate} -> ${rate.sellRate}`
        : `Le taux USD/CDF a été créé par ${actorName}. Taux de change : ${rate.exchangeRate}, Vente : ${rate.sellRate}`,
      actor,
    );
  }

  /**
   * Convertit un prix dans les deux devises avec le taux de change courant.
   */
  async toBothCurrencies(amount: number, currency: 'USD' | 'CDF') {
    const rate = await this.getCurrentRate();

    // Sans taux, aucun prix ne peut être converti.
    if (!rate) {
      throw new UnprocessableEntityException('Aucun taux de change disponible');
    }

    // Le prix saisi est gardé tel quel ; l'autre devise est calculée au taux de change.
    return currency === 'USD'
      ? { usd: amount, cdf: amount * rate.exchangeRate }
      : { usd: amount / rate.exchangeRate, cdf: amount };
  }
}
