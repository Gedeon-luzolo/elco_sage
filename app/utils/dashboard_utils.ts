import type Sale from '#models/sale'

/**
 * Calcule le reste à payer d'une vente à crédit.
 * Les recouvrements d'une autre devise sont ignorés pour ne pas faire de conversion implicite.
 */
export function getDashboardSaleRemainingDebt(sale: Sale) {
  // On additionne tous les paiements connus de cette vente dans la même devise.
  const recoveredAmount = (sale.recoveries ?? [])
    .filter((recovery) => recovery.currency === sale.currency)
    .reduce((total, recovery) => total + Number(recovery.amount || 0), 0)

  // Math.max empêche un reste négatif si une ancienne donnée contient un trop-perçu.
  return Math.max(Number(sale.totalAmount || 0) - recoveredAmount, 0)
}
