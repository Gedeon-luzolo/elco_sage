import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

export type SelectOption<T extends string = string> = {
  value: T
  label: string
}

type OptionSelectProps<T extends string> = {
  id?: string
  name?: string
  options: readonly SelectOption<T>[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: T) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

// Liste déroulante simple à partir d'une liste d'options { value, label }.
export function OptionSelect<T extends string = string>({
  id,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  required,
  disabled,
  className = 'h-10 w-full',
}: OptionSelectProps<T>) {
  return (
    <Select
      id={id}
      name={name}
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(newValue) => {
        if (newValue !== null) onValueChange?.(newValue as T)
      }}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
