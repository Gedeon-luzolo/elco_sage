import { toProductServiceResponse } from '../../../catalog/product-services/utils/product-service.utils.js';
import { getUserDisplayName } from '../../../users/utils/user.utils.js';
import { toSaleRecoveryResponse } from '../../recoveries/utils/sale-recovery.utils.js';
import type { SaleItem } from '../entities/sale-item.entity.js';
import type { Sale } from '../entities/sale.entity.js';

/**
 * Arrondit un montant au centime, comme la colonne numeric(15, 2).
 */
export function roundAmount(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Ce que l'API expose d'une ligne de vente, avec son service.
 */
export function toSaleItemResponse(item: SaleItem) {
  return {
    id: item.id,
    saleId: item.saleId,
    productServiceId: item.productServiceId,
    quantity: item.quantity,
    currency: item.currency,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    productService: item.productService
      ? toProductServiceResponse(item.productService)
      : null,
  };
}

/**
 * Ce que l'API expose d'une vente : les utilisateurs sont réduits à leur nom, jamais envoyés entiers.
 */
export function toSaleResponse(sale: Sale) {
  return {
    id: sale.id,
    cashSessionId: sale.cashSessionId,
    customerId: sale.customerId,
    operatorId: sale.operatorId,
    sellerId: sale.sellerId,
    paymentType: sale.paymentType,
    paymentMethod: sale.paymentMethod,
    paymentReference: sale.paymentReference,
    additionNumber: sale.additionNumber,
    saleDate: sale.saleDate,
    currency: sale.currency,
    theoreticalAmount: sale.theoreticalAmount,
    discountAmount: sale.discountAmount,
    totalAmount: sale.totalAmount,
    status: sale.status,
    // Le statut de la caisse dit à la SPA si l'annulation est encore possible.
    cashSessionStatus: sale.cashSession?.status ?? null,
    customer: sale.customer ?? null,
    operatorName: getUserDisplayName(sale.operator),
    sellerName: getUserDisplayName(sale.seller),
    items: (sale.items ?? []).map(toSaleItemResponse),
    recoveries: (sale.recoveries ?? []).map(toSaleRecoveryResponse),
  };
}
