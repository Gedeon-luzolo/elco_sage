import type { ReactNode } from 'react'

interface DashboardPrintStatItem {
  label: string
  value: ReactNode
  emphasis?: boolean
}

interface DashboardPrintStatsSectionProps {
  stats: DashboardPrintStatItem[]
}

export function DashboardPrintStatsSection({ stats }: DashboardPrintStatsSectionProps) {
  // Si les stats sonts vides alors envoi null
  if (stats.length === 0) {
    return null
  }

  return (
    <section className="mb-4 grid grid-cols-4 gap-2 print:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-md border border-gray-300 px-3 py-2 text-black">
          <p className="text-[9px] uppercase text-gray-600">{stat.label}</p>
          <div className={stat.emphasis ? 'text-sm font-bold' : 'text-xs font-semibold'}>
            {stat.value}
          </div>
        </div>
      ))}
    </section>
  )
}
