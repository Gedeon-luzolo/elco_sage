import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

export interface BatchOptions {
  offset?: number
  limit?: number
  maxLimit: number
  defaultLimit: number
}

export interface BatchPagination {
  offset: number
  limit: number
  totalItems: number
}

export interface BatchResult<Row> {
  items: Row[]
  pagination: BatchPagination
}

// Lit un entier de la requête, ou la valeur par défaut si le paramètre est absent ou invalide.
export function parseBatchParam(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value), 10)

  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Charge un lot d'une liste filtrée et renvoie le total, pour que le client calcule ses pages.
 * La requête reçue ne porte que les filtres : le total est compté avant que `load` n'ajoute
 * les relations et le tri, puis le lot est découpé avec un `limit` borné par `maxLimit`.
 */
export async function paginateBatch<Model extends LucidModel>(
  query: ModelQueryBuilderContract<Model>,
  options: BatchOptions,
  load: (query: ModelQueryBuilderContract<Model>) => void
): Promise<BatchResult<InstanceType<Model>>> {
  // Les bornes protègent l'API contre les lots trop volumineux
  const offset = Math.max(0, options.offset ?? 0)
  const limit = Math.min(options.maxLimit, Math.max(1, options.limit ?? options.defaultLimit))

  // Le total est compté sur les filtres seuls, avant le tri et les relations
  const countRow = await query.clone().count('* as total').first()
  const totalItems = Number(countRow?.$extras.total ?? 0)

  load(query)
  const items = await query.offset(offset).limit(limit)

  return { items, pagination: { offset, limit, totalItems } }
}
