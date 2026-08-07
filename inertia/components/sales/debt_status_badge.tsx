import { Badge } from '~/components/ui/badge'
import type { DebtStatus } from '~/types/debt_types'

interface DebtStatusBadgeProps {
  status: DebtStatus
}

export function DebtStatusBadge({ status }: DebtStatusBadgeProps) {
  switch (status) {
    case 'UNPAID':
      return <Badge className="bg-red-500 text-white hover:bg-red-600">Non payée</Badge>
    case 'PARTIAL':
      return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Partielle</Badge>
    case 'PAID':
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Soldée</Badge>
    default:
      return <Badge className="bg-gray-500 text-white hover:bg-gray-600">{status}</Badge>
  }
}
