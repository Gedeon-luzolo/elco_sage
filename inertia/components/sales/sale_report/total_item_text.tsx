import { ReactNode } from 'react'

export function TotalItem({
  label,
  value,
  accent,
}: {
  label: string
  value: ReactNode
  accent?: 'bad' | 'good' | 'debt'
}) {
  const colorClass =
    accent === 'bad'
      ? 'text-red-600'
      : accent === 'good'
        ? 'text-green-600'
        : accent === 'debt'
          ? 'text-orange-600'
          : 'text-gray-900'

  return (
    <span>
      {label}: <strong className={colorClass}>{value}</strong>
    </span>
  )
}
