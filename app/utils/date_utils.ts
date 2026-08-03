import { DateTime } from 'luxon'

export interface NormalizedDateRange {
  startDate: Date
  endDate: Date
}

// Normalise une plage pour couvrir les journées complètes.
export function normalizeDateRange(startDate: string, endDate: string): NormalizedDateRange {
  return {
    startDate: DateTime.fromISO(startDate).startOf('day').toJSDate(),
    endDate: DateTime.fromISO(endDate).endOf('day').toJSDate(),
  }
}
