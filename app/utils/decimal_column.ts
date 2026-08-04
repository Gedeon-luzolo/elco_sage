import type { ColumnOptions } from '@adonisjs/lucid/types/model'

export const decimalColumn = {
  consume: (value: string | number | null) => (value === null ? null : Number(value)),
  prepare: (value: number | null) => value,
} satisfies Partial<ColumnOptions>
