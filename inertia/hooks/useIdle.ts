import { useEffect, useRef, useState } from 'react'
import { IDLE_ACTIVITY_EVENTS, IDLE_STORAGE_KEYS, IDLE_TIMEOUT_MS } from '~/constants/idle'
import { formatLongDate, formatShortTime } from '~/utils/date'
import { type Data } from '@generated/data'

// Sauvegarde le dernier instant d'activite utilisateur.
const saveLastActivity = () => {
  window.localStorage.setItem(IDLE_STORAGE_KEYS.lastActivityAt, String(Date.now()))
}

// Verifie si la session est deja verrouillee dans le navigateur.
const isStoredLocked = () => {
  return window.localStorage.getItem(IDLE_STORAGE_KEYS.locked) === 'true'
}

// Sauvegarde l'etat verrouille ou deverrouille.
const saveLockedState = (value: boolean) => {
  window.localStorage.setItem(IDLE_STORAGE_KEYS.locked, String(value))
}

// Recupere le token XSRF depuis les cookies.
const getXsrfToken = () => {
  const tokenCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))

  return tokenCookie ? decodeURIComponent(tokenCookie.split('=')[1]) : ''
}

/**
 * Gere le verrouillage automatique apres inactivite.
 * Expose l'etat idle et la verification du mot de passe.
 * Reste volontairement limite a la session utilisateur courante.
 */
export function useIdle(user?: Data.User) {
  const [isIdle, setIsIdle] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const idleTimerRef = useRef<number | null>(null)

  const formattedDate = formatLongDate(currentTime)
  const formattedTime = formatShortTime(currentTime)

  // Annule le timer idle courant.
  const clearIdleTimer = () => {
    if (idleTimerRef.current === null) {
      return
    }

    window.clearTimeout(idleTimerRef.current)
    idleTimerRef.current = null
  }

  // Lance un nouveau timer d'inactivite.
  const startIdleTimer = () => {
    clearIdleTimer()

    idleTimerRef.current = window.setTimeout(() => {
      // Une fois idle, on bloque l'interface jusqu'au mot de passe valide.
      saveLockedState(true)
      setIsIdle(true)
    }, IDLE_TIMEOUT_MS)
  }

  // Enregistre une activite utilisateur.
  const registerActivity = () => {
    if (document.visibilityState === 'hidden') {
      return
    }

    saveLastActivity()
    startIdleTimer()
  }

  // Deverrouille apres validation du mot de passe.
  const unlock = () => {
    saveLastActivity()
    saveLockedState(false)
    setIsIdle(false)
    setPassword('')
    setError(null)
    startIdleTimer()
  }

  /**
   * Verifie le mot de passe courant aupres du backend.
   * L'endpoint ne modifie pas les tentatives de login du compte.
   * Deverrouille seulement si le backend confirme valid=true.
   */
  const verifyPassword = async () => {
    if (!password.trim()) {
      setError('Veuillez saisir votre mot de passe')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch('/auth/verify-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
        },
        body: JSON.stringify({ password }),
      })

      const data = (await response.json()) as { valid?: boolean }

      if (!response.ok || !data.valid) {
        setError('Mot de passe incorrect')
        return
      }

      unlock()
    } catch {
      // Une erreur reseau ne doit jamais deverrouiller l'ecran.
      setError('Impossible de verifier le mot de passe')
    } finally {
      setIsVerifying(false)
    }
  }

  // Efface la saisie de mot de passe sans deverrouiller.
  const clearPasswordPrompt = () => {
    setPassword('')
    setError(null)
  }

  useEffect(() => {
    if (!user) {
      clearIdleTimer()
      setIsIdle(false)
      return
    }

    if (isStoredLocked()) {
      // Un refresh ne doit pas sortir l'utilisateur du verrouillage.
      setIsIdle(true)
      return clearIdleTimer
    }

    saveLastActivity()
    startIdleTimer()
    IDLE_ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, registerActivity)
    )

    return () => {
      // Le nettoyage evite les listeners doublons apres navigation Inertia.
      clearIdleTimer()
      IDLE_ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, registerActivity)
      )
    }
  }, [user?.id, isIdle])

  useEffect(() => {
    const clockId = window.setInterval(() => setCurrentTime(new Date()), 1000)

    // L'horloge ne sert qu'a l'affichage de l'ecran verrouille.
    return () => window.clearInterval(clockId)
  }, [])

  return {
    currentTime,
    error,
    formattedDate,
    formattedTime,
    isIdle,
    isVerifying,
    password,
    clearPasswordPrompt,
    setPassword,
    verifyPassword,
  }
}
