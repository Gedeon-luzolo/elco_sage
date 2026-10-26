import { Column, type ColumnOptions } from 'typeorm';

// PostgreSQL renvoie les DECIMAL en texte : on les convertit en number côté TypeScript.
const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

/**
 * Colonne numeric(15, 2) lue comme un number (montants, quantités, taux).
 */
export function DecimalColumn(
  options?: Partial<ColumnOptions>,
): PropertyDecorator {
  return Column({
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: decimalTransformer,
    ...options,
  });
}
