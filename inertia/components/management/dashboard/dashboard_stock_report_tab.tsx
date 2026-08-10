import { Package } from 'lucide-react'
import { EmptyState } from '~/components/common/empty_state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { TabsContent } from '~/components/ui/tabs'

export function DashboardStockReportTab() {
  return (
    <TabsContent value="stock-report">
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Rapport de stock</CardTitle>
          <CardDescription>Section réservée au rapport de stock par période.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Package}
            title="Rapport de stock"
            description="Les indicateurs de stock seront ajoutés dans cet onglet."
            className="border-none bg-transparent shadow-none"
          />
        </CardContent>
      </Card>
    </TabsContent>
  )
}
