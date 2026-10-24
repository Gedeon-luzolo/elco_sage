import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

// Numéros de page à afficher : toutes les pages si elles sont peu nombreuses, sinon les pages
// proches de la page courante avec la première et la dernière, séparées par des points de suspension.
function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 4

  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  // Début de la liste : les premières pages, puis la dernière
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages]
  }

  // Fin de la liste : la première page, puis les dernières
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  // Milieu : la page courante et ses voisines
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

// Pagination par numéros de page.
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className = 'mb-3 justify-center',
}: PaginationControlsProps) {
  // Une seule page : rien à paginer
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Pagination" className={`flex items-center gap-1 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="size-8 p-0"
        aria-label="Page précédente"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {getPageNumbers(currentPage, totalPages).map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            className="size-8 p-0"
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="size-8 p-0"
        aria-label="Page suivante"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
