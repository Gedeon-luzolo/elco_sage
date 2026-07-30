import { Search } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

interface PeriodSelectorProps {
  startDate: string
  endDate: string
  onDateChange: (type: 'start' | 'end', value: string) => void
  onSearch: () => void
  isLoading?: boolean
  className?: string
  hideCardWrapper?: boolean
}

// Sélecteur de période appliquée uniquement au clic.
export function PeriodSelector({
  startDate,
  endDate,
  onDateChange,
  onSearch,
  isLoading = false,
  className,
  hideCardWrapper = false,
}: PeriodSelectorProps) {
  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="grid flex-1 gap-2">
        <Label htmlFor="startDate">Début</Label>
        <Input
          id="startDate"
          type="date"
          className="h-10"
          value={startDate}
          max={endDate}
          onChange={(event) => onDateChange('start', event.target.value)}
        />
      </div>

      <div className="grid flex-1 gap-2">
        <Label htmlFor="endDate">Fin</Label>
        <Input
          id="endDate"
          type="date"
          className="h-10"
          value={endDate}
          min={startDate}
          onChange={(event) => onDateChange('end', event.target.value)}
        />
      </div>

      <Button type="button" size="lg" disabled={isLoading} onClick={onSearch}>
        <Search className="size-4" />
        {isLoading ? 'Chargement...' : 'Chercher'}
      </Button>
    </div>
  )

  if (hideCardWrapper) {
    return <div className={className}>{content}</div>
  }

  return (
    <Card className={cn('bg-background', className)}>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
