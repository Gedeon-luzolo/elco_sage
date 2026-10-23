import { useState } from 'react'
import { getLocalDateKey, getStartOfMonth } from '~/utils/date'

type SelectionDateType = 'start' | 'end'

interface UseSelectionDateParams {
  initialStartDate?: string | null
  initialEndDate?: string | null
}

// Gère une période simple appliquée par bouton.
export function useSelectionDate({
  initialStartDate,
  initialEndDate,
}: UseSelectionDateParams = {}) {
  const now = new Date()

  // Gère la date de début avec le début du mois par défaut.
  const [startDate, setStartDate] = useState(
    initialStartDate ?? getLocalDateKey(getStartOfMonth(now))
  )

  // Gère la date de fin avec la date du jour par défaut.
  const [endDate, setEndDate] = useState(initialEndDate ?? getLocalDateKey(now))

  const handleDateChange = (type: SelectionDateType, value: string) => {
    if (type === 'start') {
      setStartDate(value)
      return
    }

    setEndDate(value)
  }

  return {
    startDate,
    endDate,
    handleDateChange,
  }
}
