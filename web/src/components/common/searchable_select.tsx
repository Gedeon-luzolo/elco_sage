import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '~/components/ui/combobox'

type SearchableSelectProps<T> = {
  id?: string
  name?: string
  items: T[]
  value: string
  onValueChange: (value: string) => void
  getLabel: (item: T) => string
  getValue: (item: T) => string
  getDisabled?: (item: T) => boolean
  placeholder?: string
  emptyMessage?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// Liste déroulante avec recherche intégrée, pour les longues listes (produits, clients).
export function SearchableSelect<T>({
  id,
  name,
  items,
  value,
  onValueChange,
  getLabel,
  getValue,
  getDisabled,
  placeholder = 'Sélectionner...',
  emptyMessage = 'Aucun résultat.',
  required = false,
  disabled = false,
  className,
}: SearchableSelectProps<T>) {
  const selectedItem = value ? items.find((item) => getValue(item) === value) : undefined

  return (
    <Combobox
      items={items}
      value={selectedItem ?? null}
      onValueChange={(item) => onValueChange(item ? getValue(item) : '')}
      itemToStringLabel={getLabel}
      itemToStringValue={getValue}
      name={name}
      required={required}
      disabled={disabled}
    >
      <ComboboxTrigger id={id} className={className ?? 'h-10'}>
        <span className={`truncate ${selectedItem ? '' : 'text-muted-foreground'}`}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
      </ComboboxTrigger>

      <ComboboxContent>
        <ComboboxInput placeholder="Rechercher..." />
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={getValue(item)} value={item} disabled={getDisabled?.(item)}>
              {getLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
