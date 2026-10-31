import { UnprocessableEntityException } from '@nestjs/common';
import { Currency } from '../../../../common/enums/currency.enum.js';
import { roundAmount } from '../../../../common/utils/money-map.utils.js';
import type { ProductService } from '../entities/product-service.entity.js';

/**
 * Prix des lignes d'une vente ou d'une proforma, toujours relus dans le catalogue.
 * Les services doivent avoir été vérifiés : chaque ligne trouve le sien.
 */
export function priceItems<
  Item extends { productServiceId: string; quantity: number },
>(items: Item[], services: Map<string, ProductService>, currency: Currency) {
  const pricedItems = items.map((item) => {
    const service = services.get(item.productServiceId)!;

    // Le prix unitaire est celui du catalogue dans la devise du document.
    const unitPrice =
      currency === Currency.USD ? service.priceUsd : service.priceCdf;

    return {
      item,
      service,
      unitPrice,
      totalPrice: roundAmount(unitPrice * item.quantity),
    };
  });

  // Le total brut se déduit uniquement des lignes.
  const theoreticalAmount = roundAmount(
    pricedItems.reduce((sum, priced) => sum + priced.totalPrice, 0),
  );

  return { pricedItems, theoreticalAmount };
}

/**
 * Montants d'un document : la remise ne peut jamais dépasser le brut.
 */
export function applyDiscount(
  theoreticalAmount: number,
  discountAmount: number | null | undefined,
) {
  const discount = roundAmount(discountAmount ?? 0);

  if (discount > theoreticalAmount) {
    throw new UnprocessableEntityException(
      'La remise ne peut pas dépasser le total.',
    );
  }

  return {
    theoreticalAmount,
    discountAmount: discount,
    totalAmount: roundAmount(theoreticalAmount - discount),
  };
}
