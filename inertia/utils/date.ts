// Formate une cle YYYY-MM-DD sans conversion timezone.
export const formatDateKeyLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-')

  if (!year || !month || !day) {
    return dateKey
  }

  return `${day}/${month}/${year}`
}

// Formate une date en libelle court francais.
export const formatDateLabel = (date: Date | string) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return formatDateKeyLabel(date)
  }

  return new Date(date).toLocaleDateString('fr-FR')
}

// Formate une date en libelle long francais.
export const formatLongDate = (date: Date) => {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// Formate une date en heure courte francaise.
export const formatShortTime = (date: Date) => {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Retourne une date locale au format yyyy-mm-dd pour les inputs date.
export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// Retourne le premier jour du mois de la date donnee.
export const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Formate une date en libelle court francais.
export const formatShortDate = (dateStr: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return formatDateKeyLabel(dateStr)
  }

  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// Cle locale du jour pour les formulaires metier.
export const dateKey = getLocalDateKey()
