import { formatDateLabel, formatShortTime } from '~/utils/date'

// Formate une date liée aux dettes pour garder le même rendu sur page et dialog.
export function formatDebtSaleDate(value: string | null) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  return `${formatDateLabel(date)} à ${formatShortTime(date)}`
}
