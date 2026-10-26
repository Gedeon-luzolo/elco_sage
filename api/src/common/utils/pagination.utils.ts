import { Brackets, type ObjectLiteral, type SelectQueryBuilder } from 'typeorm';

export interface BatchOptions {
  offset?: number;
  limit?: number;
  maxLimit: number;
  search?: { term?: string; fields: string[] };
}

type BatchCountRow = { batch_total: number };

/**
 * Charge un lot d'une liste filtrée et son total, en une seule requête.
 * Le total vient de « count(*) over () », calculé avant le LIMIT : la requête ne doit joindre que des
 * relations simples (une ligne par élément) ; les listes liées se chargent à part, sur leur table.
 */
export async function paginateBatch<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  { offset = 0, limit, maxLimit, search }: BatchOptions,
) {
  // Les bornes protègent l'API contre les lots trop volumineux ; par défaut, le lot maximal.
  const batchOffset = Math.max(0, offset);
  const batchLimit = Math.min(maxLimit, Math.max(1, limit ?? maxLimit));

  // La recherche n'est ajoutée que si un texte exploitable est fourni.
  const term = search?.term?.trim();
  if (search && term) {
    // Les OR sont groupés pour ne pas défaire les filtres métier déjà posés.
    query.andWhere(
      new Brackets((brackets) => {
        search.fields.forEach((field, index) => {
          const condition = `${field} ILIKE :batchSearch`;
          const parameters = { batchSearch: `%${term}%` };

          // Le premier champ ouvre le groupe, les suivants s'y ajoutent en OR.
          if (index === 0) {
            brackets.where(condition, parameters);
          } else {
            brackets.orWhere(condition, parameters);
          }
        });
      }),
    );
  }

  const { entities, raw } = await query
    .addSelect('count(*) over ()::int', 'batch_total')
    .offset(batchOffset)
    .limit(batchLimit)
    .getRawAndEntities<BatchCountRow>();

  return {
    items: entities,
    // Le total est répété sur chaque ligne ; un lot vide ne le porte pas.
    pagination: {
      offset: batchOffset,
      limit: batchLimit,
      totalItems: raw[0]?.batch_total ?? 0,
    },
  };
}
