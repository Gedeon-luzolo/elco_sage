import { forwardRef, type ComponentProps } from 'react'
import { Link } from 'react-router-dom'

// Lien interne : garde l'API `href` des anciens liens Inertia pour ne pas toucher aux pages.
export const AppLink = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentProps<typeof Link>, 'to'> & { href: string }
>(function AppLink({ href, ...props }, ref) {
  return <Link ref={ref} to={href} {...props} />
})
