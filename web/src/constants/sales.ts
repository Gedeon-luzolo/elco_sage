import { CalendarDays, CreditCard, HandCoins, History, type LucideIcon } from 'lucide-react'

export interface SalesNavLink {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

// Destinations secondaires affichées en tuiles sur la page de navigation des ventes.
export const SALES_NAV_LINKS: SalesNavLink[] = [
  {
    title: 'Historique',
    description: 'Retrouver et réimprimer une addition passée',
    href: '/sales/history',
    icon: History,
  },
  {
    title: 'Recouvrements',
    description: 'Suivre les paiements reçus sur les ventes à crédit',
    href: '/sales/recoveries',
    icon: HandCoins,
  },
  {
    title: 'Crédits',
    description: 'Suivre les ventes à crédit et les paiements restants',
    href: '/sales/debts',
    icon: CreditCard,
  },
  {
    title: 'Sessions',
    description: 'Consulter les sessions de caisse ouvertes et clôturées',
    href: '/sales/sessions',
    icon: CalendarDays,
  },
]

// Historique des ventes : un lot du serveur alimente deux pages affichées.
export const SALES_HISTORY_PAGE_SIZE = 20
export const SALES_HISTORY_BATCH_SIZE = 40
