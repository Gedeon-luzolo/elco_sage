import { DateTime } from 'luxon'

export interface NormalizedDateRange {
  startDate: Date
  endDate: Date
}

// Date locale du jour au format YYYY-MM-DD.
export function todayDateKey(): string {
  return DateTime.now().toISODate()!
}

// Parse une cle YYYY-MM-DD comme une date locale sans heure.
export function dateKeyToDay(date: string): DateTime {
  return DateTime.fromISO(date).startOf('day')
}

// Refuse les dates futures en comparant uniquement les jours locaux, sans heure.
export function ensureDateIsNotFuture(date: string) {
  const movementDate = dateKeyToDay(date)
  const today = dateKeyToDay(todayDateKey())

  if (movementDate > today) {
    throw new Error('Impossible de travailler sur un mouvement de stock dans le futur.')
  }
}

// Normalise une plage pour couvrir les journees completes.
export function normalizeDateRange(startDate: string, endDate: string): NormalizedDateRange {
  return {
    startDate: DateTime.fromISO(startDate).startOf('day').toJSDate(),
    endDate: DateTime.fromISO(endDate).endOf('day').toJSDate(),
  }
}
