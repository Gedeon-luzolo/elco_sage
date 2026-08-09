import {
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationModuleItem {
  title: string
  description: string
  icon: LucideIcon
  href: string
  subItems?: { title: string; href: string }[]
}

export interface NavigationModule {
  title: string
  description: string
  icon: LucideIcon
  isManagement?: boolean
  href?: string
  color: {
    header: string
    icon: string
    title: string
    badge: string
    button: string
  }
}

/**
 * Liste principale des modules affichés sur la page home.
 * Cette constante est réservée aux pages de navigation UI.
 * La protection d'accès reste gérée côté middleware backend.
 */
export const MODULES: NavigationModule[] = [
  {
    title: 'Gestion des ventes',
    description: 'Suivre les ventes, encaissements et opérations commerciales.',
    icon: ShoppingCart,
    href: '/sales',
    color: {
      header: 'from-rose-600 to-fuchsia-600 shadow-rose-600/20',
      icon: 'bg-rose-600 text-white shadow-rose-600/20',
      title: 'text-rose-700 dark:text-rose-300',
      badge:
        'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300',
      button:
        'border-rose-300 text-rose-700 hover:bg-rose-600 hover:text-white dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white',
    },
  },
  {
    title: 'Gestion des clients',
    description: 'Créer les fiches clients et suivre leur statut commercial.',
    icon: Users,
    href: '/customers',
    color: {
      header: 'from-cyan-600 to-sky-600 shadow-cyan-600/20',
      icon: 'bg-cyan-600 text-white shadow-cyan-600/20',
      title: 'text-cyan-700 dark:text-cyan-300',
      badge:
        'border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300',
      button:
        'border-cyan-300 text-cyan-700 hover:bg-cyan-600 hover:text-white dark:border-cyan-900 dark:text-cyan-300 dark:hover:bg-cyan-600 dark:hover:text-white',
    },
  },
  {
    title: 'Gestion de stock',
    description: 'Contrôler les entrées, sorties et niveaux disponibles.',
    icon: Boxes,
    href: '/stock',
    color: {
      header: 'from-emerald-600 to-lime-600 shadow-emerald-600/20',
      icon: 'bg-emerald-600 text-white shadow-emerald-600/20',
      title: 'text-emerald-700 dark:text-emerald-300',
      badge:
        'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
      button:
        'border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white',
    },
  },
  {
    title: 'Management',
    description: 'Administrer les accès et suivre les actions sensibles.',
    icon: ShieldCheck,
    isManagement: true,
    href: '/management',
    color: {
      header: 'from-blue-600 to-indigo-600 shadow-blue-600/20',
      icon: 'bg-blue-600 text-white shadow-blue-600/20',
      title: 'text-blue-700 dark:text-blue-300',
      badge:
        'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
      button:
        'border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white',
    },
  },
]

// Rubriques affichées dans la sidebar du module management.
export const MODULE_HEADER_ACCENTS = {
  sales: MODULES[0].color.header,
  customers: MODULES[1].color.header,
  stock: MODULES[2].color.header,
  management: MODULES[3].color.header,
} as const

export const MANAGEMENT_MODULES: NavigationModuleItem[] = [
  {
    title: 'Dashboard',
    description: 'Vue générale du module management.',
    icon: LayoutDashboard,
    href: '/management',
  },
  {
    title: 'Gestion des users',
    description: 'Créer les comptes, rôles, statuts et accès utilisateurs.',
    icon: Users,
    href: '/management/users',
  },
  {
    title: 'Journalisation',
    description: 'Consulter les actions enregistrées dans le système.',
    icon: ScrollText,
    href: '/management/journalisations',
  },
  {
    title: 'Produits & Services',
    description: 'Administrer les articles, prix, catégories et références.',
    icon: Package,
    href: '/management/product-services',
    subItems: [
      {
        title: 'Catégories',
        href: '/management/product-categories',
      },
    ],
  },
  {
    title: 'Gestion de taux',
    description: 'Définir et suivre les taux utilisés par le système.',
    icon: CircleDollarSign,
    href: '/management/rates',
  },
]
