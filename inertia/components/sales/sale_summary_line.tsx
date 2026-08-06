interface SaleSummaryLineProps {
  label: string
  value: string
  strong?: boolean
}

/**
 * Ligne d'information affichee dans le resume d'une vente.
 */
export function SaleSummaryLine({ label, value, strong = false }: SaleSummaryLineProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? 'text-lg font-semibold' : 'font-medium'}>{value}</span>
    </div>
  )
}
