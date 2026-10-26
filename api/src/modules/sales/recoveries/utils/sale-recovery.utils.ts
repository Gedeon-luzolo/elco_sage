import { getUserDisplayName } from '../../../users/utils/user.utils.js';
import type { SaleRecovery } from '../entities/sale-recovery.entity.js';

/**
 * Ce que l'API expose d'un recouvrement : l'encaisseur est réduit à son nom.
 */
export function toSaleRecoveryResponse(recovery: SaleRecovery) {
  return {
    id: recovery.id,
    saleId: recovery.saleId,
    cashSessionId: recovery.cashSessionId,
    receivedById: recovery.receivedById,
    amount: recovery.amount,
    currency: recovery.currency,
    paymentMethod: recovery.paymentMethod,
    paymentReference: recovery.paymentReference,
    recoveredAt: recovery.recoveredAt,
    receivedByName: getUserDisplayName(recovery.receivedBy),
  };
}
