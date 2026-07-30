import { Save } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'


interface ExchangeRateFormProps {
  errors: Record<string, string | undefined>
  processing: boolean
  onSubmit: (formData: FormData) => void
}

// Affiche le formulaire de mise a jour du taux courant.
export function ExchangeRateForm({
  errors,
  processing,
  onSubmit,
}: ExchangeRateFormProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Changer le taux</CardTitle>
        <CardDescription>
          La nouvelle valeur deviendra le taux actuel sans supprimer l&apos;historique.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form key={'new-rate'} className="grid gap-5" action={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="usdToCdfBuyRate">Taux d&apos;achat</Label>
            <div className="relative">
              <Input
                id="usdToCdfBuyRate"
                name="usdToCdfBuyRate"
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
            {errors.usdToCdfBuyRate && (
              <p className="text-xs text-destructive">{errors.usdToCdfBuyRate}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="usdToCdfSellRate">Taux de vente</Label>
            <div className="relative">
              <Input
                id="usdToCdfSellRate"
                name="usdToCdfSellRate"
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
            {errors.usdToCdfSellRate && (
              <p className="text-xs text-destructive">{errors.usdToCdfSellRate}</p>
            )}
          </div>

          <Button type="submit" className="justify-self-start" disabled={processing}>
            <Save className="size-4" />
            {processing ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
