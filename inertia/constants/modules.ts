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
  },
  {
    title: 'Gestion des clients',
    description: 'Créer les fiches clients et suivre leur statut commercial.',
    icon: Users,
    href: '/customers',
  },
  {
    title: 'Gestion de stock',
    description: 'Contrôler les entrées, sorties et niveaux disponibles.',
    icon: Boxes,
    href: '/stock',
  },
  {
    title: 'Management',
    description: 'Administrer les accès et suivre les actions sensibles.',
    icon: ShieldCheck,
    isManagement: true,
    href: '/management',
  },
]

// Rubriques affichées dans la sidebar du module management.
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
