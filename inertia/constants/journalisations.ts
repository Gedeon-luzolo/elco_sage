import type {
  JournalisationModule,
  JournalisationModuleFilter,
  JournalisationSelectOption,
} from '~/types/journalisation_types'

// Libellés lisibles des modules enregistrés dans le journal.
export const JOURNALISATION_MODULE_LABELS: Record<JournalisationModule, string> = {
  AUTHENTIFICATION: 'Authentification',
  USERS: 'Employés',
  EXCHANGE_RATES: 'Taux de change',
}

// Options disponibles dans le filtre module.
export const JOURNALISATION_MODULE_OPTIONS: Array<
  JournalisationSelectOption<JournalisationModuleFilter>
> = [
  { value: 'ALL', label: 'Tous les modules' },
  { value: 'AUTHENTIFICATION', label: 'Authentification' },
  { value: 'USERS', label: 'Employés' },
  { value: 'EXCHANGE_RATES', label: 'Taux de change' },
]
