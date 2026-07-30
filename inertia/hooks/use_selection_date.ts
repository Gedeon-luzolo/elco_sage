import { useState } from 'react'
import { getLocalDateKey, getStartOfMonth } from '~/utils/date'

type SelectionDateType = 'start' | 'end'

// Gère une période simple appliquée par bouton.
export function useSelectionDate() {
  const now = new Date()
  const [startDate, setStartDate] = useState(getLocalDateKey(getStartOfMonth(now)))
  const [endDate, setEndDate] = useState(getLocalDateKey(now))

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
