import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface PaginationControlsProps {
  canGoPrevious: boolean
  canGoNext: boolean
  pageSize: number
  onPrevious: () => void
  onNext: () => void
}

// Actions de pagination en mémoire.
export function PaginationControls({
  canGoPrevious,
  canGoNext,
  pageSize,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b pb-4">
      <p className="text-sm text-muted-foreground">{pageSize} lignes par page.</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" disabled={!canGoPrevious} onClick={onPrevious}>
          <ChevronLeft className="size-4" />
          Précédent
        </Button>
        <Button type="button" variant="outline" disabled={!canGoNext} onClick={onNext}>
          Suivant
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
