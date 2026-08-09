import Customer from '#models/customer'
import { JournalisationModule } from '#models/journalisation'
import type User from '#models/user'
import JournalisationService from '#services/journalisation/journalisation_service'
import type { CreateCustomerInput, UpdateCustomerInput } from '#validators/customer'
import { inject } from '@adonisjs/core'

@inject()
export default class CustomerService {
  constructor(private journalisationService: JournalisationService) {}

  /**
   * Recupere la liste des customers et les statistiques.
   */
  async getOverview() {
    // Recuperer les customers du plus recent au plus ancien.
    const customers = await Customer.query().orderBy('created_at', 'desc')

    // Compter les customers actifs et inactifs.
    const total = customers.length
    const activeCount = customers.filter((customer) => customer.isActive).length

    return {
      customers,
      stats: {
        total,
        activeCount,
        inactiveCount: total - activeCount,
      },
    }
  }

  /**
   * Recupere les clients actifs selectionnables dans une vente.
   */
  async getActiveCustomersForSale() {
    return Customer.query().where('isActive', true).orderBy('fullName', 'asc')
  }

  /**
   * Cree un nouveau customer actif par defaut.
   */
  async create(actor: User, payload: CreateCustomerInput) {
    // Verifier en une seule requete les doublons possibles.
    const existing = await Customer.query()
      .where('full_name', payload.fullName)
      .if(Boolean(payload.email), (query) => {
        query.orWhere('email', payload.email!)
      })
      .first()

    if (existing) {
      if (existing.fullName === payload.fullName) {
        throw new Error('Un client portant ce nom existe deja.')
      }

      throw new Error('Cet email est deja utilise par un autre client.')
    }

    // Creer le customer avec le statut actif.
    const customer = await Customer.create({
      fullName: payload.fullName,
      customerType: payload.customerType as any,
      phoneNumber: payload.phoneNumber ?? null,
      email: payload.email ?? null,
      isActive: true,
    })

    // Enregistrer la journalisation.
    await this.journalisationService.create({
      module: JournalisationModule.CUSTOMERS,
      message: `Le client "${customer.fullName}" a ete cree par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return customer
  }

  /**
   * Modifie un customer existant.
   */
  async update(actor: User, id: string, payload: UpdateCustomerInput) {
    const customer = await Customer.findOrFail(id)

    // Verifier si le nom complet existe deja sur un autre customer.
    if (payload.fullName !== customer.fullName) {
      const existing = await Customer.query()
        .where('full_name', payload.fullName)
        .whereNot('id', id)
        .first()

      if (existing) {
        throw new Error('Un client portant ce nom existe deja.')
      }
    }

    // Si l'email change, verifier qu'il n'est pas deja utilise par un autre customer.
    if (payload.email && payload.email !== customer.email) {
      await this.ensureEmailAvailable(payload.email, id)
    }

    const previousName = customer.fullName
    customer.fullName = payload.fullName
    customer.customerType = payload.customerType as any
    customer.phoneNumber = payload.phoneNumber ?? null
    customer.email = payload.email ?? null

    // Appliquer le statut uniquement quand il est explicitement envoye.
    if (payload.isActive !== undefined && payload.isActive !== null) {
      customer.isActive = Boolean(payload.isActive)
    }

    await customer.save()

    // Enregistrer la journalisation.
    await this.journalisationService.create({
      module: JournalisationModule.CUSTOMERS,
      message: `Le client "${previousName}" a ete mis a jour par ${actor.fullName ?? actor.email}.`,
      user: actor,
    })

    return customer
  }

  // Verifie que l'email n'est pas deja porte par un autre customer.
  private async ensureEmailAvailable(email: string, ignoredCustomerId?: string) {
    const query = Customer.query().where('email', email)

    if (ignoredCustomerId) {
      query.whereNot('id', ignoredCustomerId)
    }

    const existing = await query.first()
    if (existing) {
      throw new Error('Cet email est deja utilise par un autre client.')
    }
  }
}
