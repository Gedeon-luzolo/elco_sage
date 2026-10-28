import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Hauteur d'écran restante sous le haut d'un élément (barre d'application, bande hors ligne...).
 * L'élément qui la reçoit tient alors dans l'écran sans faire défiler la page.
 */
export function useRemainingViewportHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [top, setTop] = useState(0)

  useLayoutEffect(() => {
    // Position du haut de l'élément dans la page, indépendante du défilement
    const measure = () => {
      const element = ref.current

      if (element) setTop(element.getBoundingClientRect().top + window.scrollY)
    }

    measure()

    // La bande hors ligne peut apparaître au-dessus : on remesure quand la page change de taille
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { ref, height: `calc(100dvh - ${top}px)` }
}
