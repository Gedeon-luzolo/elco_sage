import { Badge } from '~/components/ui/badge'
import type { DebtStatus } from '~/types/debt_types'
import { formatDebtStatusLabel } from '~/utils/sales/debt.utils'

interface DebtStatusBadgeProps {
  status: DebtStatus
}

export function DebtStatusBadge({ status }: DebtStatusBadgeProps) {
  switch (status) {
    case 'UNPAID':
      return <Badge className="bg-red-500 text-white hover:bg-red-600">{formatDebtStatusLabel(status)}</Badge>
    case 'PARTIAL':
      return <Badge className="bg-orange-500 text-white hover:bg-orange-600">{formatDebtStatusLabel(status)}</Badge>
    case 'PAID':
      return <Badge className="bg-green-500 text-white hover:bg-green-600">{formatDebtStatusLabel(status)}</Badge>
    default:
      return <Badge className="bg-gray-500 text-white hover:bg-gray-600">{formatDebtStatusLabel(status)}</Badge>
  }
}
