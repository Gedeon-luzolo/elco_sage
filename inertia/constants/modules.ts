import {
  Boxes,
  ClipboardList,
  Package,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationModule {
  title: string
  description: string
  icon: LucideIcon
  isManagement?: boolean
  href?: string
}

/**
 * Liste principale des modules affiches sur la page home.
 * Cette constante est reservee aux pages de navigation UI.
 * La protection d'acces reste geree cote middleware backend.
 */
export const MODULES: NavigationModule[] = [
  {
    title: 'Gestion des ventes',
    description: 'Suivre les ventes, encaissements et operations commerciales.',
    icon: ShoppingCart,
  },
  {
    title: 'Gestion des produits',
    description: 'Administrer les articles, prix, categories et references.',
    icon: Package,
  },
  {
    title: 'Gestion de stock',
    description: 'Controler les entrees, sorties et niveaux disponibles.',
    icon: Boxes,
  },
  {
    title: 'Inventaires',
    description: 'Preparer les comptages et rapprocher les ecarts de stock.',
    icon: ClipboardList,
  },
  {
    title: 'Gestion des users',
    description: 'Creer les comptes, roles, statuts et acces utilisateurs.',
    icon: Users,
    isManagement: true,
    href: '/users',
  },
  {
    title: 'Parametres',
    description: 'Configurer les preferences et informations du systeme.',
    icon: Settings,
  },
]
