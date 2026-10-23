import { useEffect, useRef, useState } from 'react'
import { IDLE_ACTIVITY_EVENTS, IDLE_TIMEOUT_MS } from '~/constants/idle'
import { formatLongDate, formatShortTime } from '~/utils/date'
import type { UserDTO } from '~/types/dto'

/**
 * Gere le verrouillage automatique apres inactivite.
 * Expose l'etat idle et la reprise de la session sans verification.
 * Reste volontairement limite a la session utilisateur courante.
 */
export function useIdle(user?: UserDTO) {
  const [isIdle, setIsIdle] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
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
      // Une fois idle, l'ecran de veille reste affiche jusqu'a la reprise.
      setIsIdle(true)
    }, IDLE_TIMEOUT_MS)
  }

  // Enregistre une activite utilisateur.
  const registerActivity = () => {
    if (document.visibilityState === 'hidden') {
      return
    }

    startIdleTimer()
  }

  // Reprend la session des que l'utilisateur clique ou appuie sur une touche.
  const resume = () => {
    setIsIdle(false)
  }

  useEffect(() => {
    if (!user) {
      clearIdleTimer()
      setIsIdle(false)
      return
    }

    // Pendant la veille, plus de timer ni d'écoute : la reprise relance l'effet.
    if (isIdle) {
      return
    }

    startIdleTimer()
    IDLE_ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, registerActivity)
    )

    return () => {
      // Le nettoyage evite les listeners doublons apres navigation.
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
    formattedDate,
    formattedTime,
    isIdle,
    resume,
  }
}
