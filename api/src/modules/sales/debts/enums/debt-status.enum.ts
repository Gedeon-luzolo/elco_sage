// État d'une vente à crédit, toujours déduit de ses recouvrements : il n'est jamais stocké.
export enum DebtStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}
