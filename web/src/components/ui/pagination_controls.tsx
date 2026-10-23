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
    <div className="mb-4 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">{pageSize} lignes par page.</p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={!canGoPrevious}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-4" />
          Précédent
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={!canGoNext}
          onClick={onNext}
        >
          Suivant
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
