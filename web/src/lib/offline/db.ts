import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SaleItemRow } from '~/types/sale_types'

// Types d'écritures faites hors ligne qui peuvent être mises dans la file d'attente.
export type OutboxType = 'sale' | 'recovery'

// Écriture faite hors ligne, rejouée telle quelle au retour du réseau.
// L'id est généré par le client et sert aussi de clé d'idempotence côté serveur.
export interface OutboxEntry {
  id: string
  type: OutboxType
  userId: string
  path: string
  body: Record<string, unknown>
  summary: string
  sale: SaleItemRow | null
  createdAt: number
  status: 'pending' | 'conflict'
  error: string | null
  attempts: number
}

// État de la numérotation hors ligne d'un vendeur : sa lettre et son dernier compteur.
// id est celui de l'utilisateur
export interface NumberingState {
  id: string
  sellerCode: string
  cursor: number
}

// Structure de la base IndexedDB : la file, la numérotation et le cache de lecture (kv).
interface ElcoDB extends DBSchema {
  outbox: { key: string; value: OutboxEntry }
  numbering: { key: string; value: NumberingState }
  kv: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<ElcoDB>> | null = null

// Ouvre la base une seule fois et réutilise la connexion ensuite.
export function getDb() {
  dbPromise ??= openDB<ElcoDB>('elco_sage', 3, {
    // Création des tables au premier lancement, puis évolutions des versions suivantes
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('outbox', { keyPath: 'id' })
        db.createObjectStore('numbering', { keyPath: 'id' })
        db.createObjectStore('kv')
        return
      }

      // Version 2 : la numérotation est rangée par utilisateur et par session.
      // L'ancien état est supprimé : il est relu depuis le serveur à la prochaine connexion.
      if (oldVersion < 2) {
        db.deleteObjectStore('numbering')
        db.createObjectStore('numbering', { keyPath: 'id' })
        return
      }

      // Version 3 : les plages de numéros laissent la place à une lettre et un compteur par vendeur.
      // L'ancien état est supprimé : il est relu depuis le serveur à la prochaine connexion.
      if (oldVersion < 3) {
        db.deleteObjectStore('numbering')
        db.createObjectStore('numbering', { keyPath: 'id' })
      }
    },
  })

  return dbPromise
}
