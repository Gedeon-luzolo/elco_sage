// Cash : payée tout de suite ; Credit : réglée par recouvrements ; Offert : gratuite.
export enum SalePaymentType {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
  OFFERED = 'OFFERED',
}

// Une vente annulée reste dans l'historique mais sort des totaux.
export enum SaleStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}
