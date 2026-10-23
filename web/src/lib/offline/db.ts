import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { SaleItemRow } from '~/types/sale_types'

// Types d'écritures faites hors ligne qui peuvent être mises dans la file d'attente.
export type OutboxType = 'sale' | 'recovery'

// Écriture faite hors ligne, rejouée telle quelle au retour du réseau.
// L'id est généré par le client et sert aussi de clé d'idempotence côté serveur.
// userId est l'utilisateur qui a fait l'opération : une entrée n'est rejouée que pour lui.
// summary est le libellé affiché dans la file (ex : "Vente 00203").
// sale est la vente locale utilisée pour le ticket tant que le serveur ne la connaît pas.
// error contient la raison du refus du serveur quand le statut vaut "conflict".
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

// État de la numérotation locale d'une session de caisse.
// cursor est le dernier numéro consommé (0 si aucun) : il n'est jamais réutilisé.
export interface NumberingState {
  cashSessionId: string
  blocks: Array<{ startNumber: number; endNumber: number }>
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
  dbPromise ??= openDB<ElcoDB>('elco_sage', 1, {
    // Création des tables au premier lancement
    upgrade(db) {
      db.createObjectStore('outbox', { keyPath: 'id' })
      db.createObjectStore('numbering', { keyPath: 'cashSessionId' })
      db.createObjectStore('kv')
    },
  })

  return dbPromise
}

// Oublie la connexion courante : utilisé par les tests pour repartir d'une base vide.
export function resetDbConnection() {
  dbPromise = null
}
