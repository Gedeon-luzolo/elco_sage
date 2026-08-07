import type { ReactNode } from 'react'

interface TotalTextProps {
  label: string
  value: ReactNode
  highlight?: boolean
  danger?: boolean
}

export function TotalText({ label, value, highlight = false, danger = false }: TotalTextProps) {
  return (
    <span className={danger ? 'text-red-600' : undefined}>
      {label}: <strong className={highlight ? 'text-green-600' : undefined}>{value}</strong>
    </span>
  )
}
