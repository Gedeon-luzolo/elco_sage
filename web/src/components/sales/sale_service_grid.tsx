import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'
import type { ProductServiceDTO } from '~/types/dto'
import type { CurrencyCode } from '~/utils/currency'
import { formatMoneyWithCurrency } from '~/utils/format_number.utils'
import { getSaleServiceUnitPrice } from '~/utils/sales/sale.utils'

const ALL_CATEGORIES = 'Tout'
const OTHER_CATEGORY = 'Autres'

interface SaleServiceGridProps {
  services: ProductServiceDTO[]
  currency: CurrencyCode
  quantityByServiceId: Map<string, number>
  onPick: (serviceId: string) => void
}

// Grille de services à toucher pour les ajouter au ticket, avec recherche et catégories.
export function SaleServiceGrid({
  services,
  currency,
  quantityByServiceId,
  onPick,
}: SaleServiceGridProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)

  // Les catégories viennent des services eux-mêmes ; ceux sans catégorie vont dans « Autres »
  const categories = useMemo(() => {
    const names = new Set(services.map((service) => service.categoryName ?? OTHER_CATEGORY))

    return [ALL_CATEGORIES, ...names]
  }, [services])

  const visibleServices = useMemo(() => {
    const term = search.trim().toLowerCase()

    return services.filter(
      (service) =>
        (category === ALL_CATEGORIES || (service.categoryName ?? OTHER_CATEGORY) === category) &&
        service.name.toLowerCase().includes(term)
    )
  }, [category, search, services])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Rechercher un service"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un service..."
          className="h-12 pl-11 text-base"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            className={cn(
              'h-9 rounded-full border px-4 text-sm font-semibold transition-colors',
              name === category
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {visibleServices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun service trouvé.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {visibleServices.map((service) => {
            const quantity = quantityByServiceId.get(service.id) ?? 0

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onPick(service.id)}
                className="relative flex h-20 flex-col justify-between rounded-xl border border-border bg-card p-2.5 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md"
              >
                <span className="line-clamp-2 text-[13px] leading-tight font-semibold">
                  {service.name}
                </span>

                <span className="text-[13px] font-bold text-foreground">
                  {formatMoneyWithCurrency(getSaleServiceUnitPrice(service, currency), currency)}
                </span>

                {quantity > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground">
                    {quantity}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
