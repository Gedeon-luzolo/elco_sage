import { formatDateTimeLabel } from '~/utils/date'

// Formate une date liée aux dettes pour garder le même rendu sur page et dialog.
export function formatDebtSaleDate(value: string | null) {
  return formatDateTimeLabel(value)
}
