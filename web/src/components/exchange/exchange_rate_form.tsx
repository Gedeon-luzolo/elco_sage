import type { FormEvent } from 'react'
import { Save } from 'lucide-react'
import { SubmitButton } from '~/components/common/submit_button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface ExchangeRateFormProps {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isPending?: boolean
}

// Affiche le formulaire de mise à jour du taux courant.
export function ExchangeRateForm({ onSubmit, isPending = false }: ExchangeRateFormProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Changer le taux</CardTitle>
        <CardDescription>
          La nouvelle valeur deviendra le taux actuel sans supprimer l&apos;historique.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form key={'new-rate'} className="grid gap-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="exchangeRate">Taux de change</Label>
            <div className="relative">
              <Input
                id="exchangeRate"
                name="exchangeRate"
                type="number"
                min="0.0001"
                step="0.0001"
                className="h-10 pr-14"
                placeholder="Ex. 2800"
                required
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                CDF
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sellRate">Taux de vente</Label>
            <div className="relative">
              <Input
                id="sellRate"
                name="sellRate"
                type="number"
                min="0.0001"
                step="0.0001"
                className="h-10 pr-14"
                placeholder="Ex. 2850"
                required
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                CDF
              </span>
            </div>
          </div>

          <SubmitButton
            className="justify-self-start"
            label="Enregistrer"
            isPending={isPending}
            icon={<Save className="size-4" />}
          />
        </form>
      </CardContent>
    </Card>
  )
}
