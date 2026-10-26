import type { ProductService } from '../entities/product-service.entity.js';
import { ProductServiceType } from '../enums/product-service-type.enum.js';

/**
 * Ce que l'API expose d'un article : la catégorie est réduite à son nom.
 */
export function toProductServiceResponse(item: ProductService) {
  // Les relations ne partent pas telles quelles : la SPA n'attend que le nom de la catégorie.
  // Les relations ne partent pas telles quelles : la SPA n'attend que le nom de la catégorie.
  const { category, stockProduct: _stockProduct, ...fields } = item;

  return { ...fields, categoryName: category?.name ?? null };
}

/**
 * Prix enregistrés et coût matière d'une unité de base.
 * Un service n'a pas de coût matière direct ; un produit est saisi au prix du conditionnement.
 */
export function buildPriceFields(
  type: ProductServiceType,
  prices: { usd: number; cdf: number },
  packagingCapacity: number | null,
) {
  // Un service n'a pas de diviseur ; un conditionnement sans capacité compte pour une unité.
  // Un service n'a pas de diviseur ; un conditionnement sans capacité compte pour une unité.
  const divider =
    type === ProductServiceType.SERVICE ? null : packagingCapacity || 1;

  return {
    // Le coût matière d'un produit est le prix du conditionnement divisé par sa capacité.
    // Le coût matière d'un produit est le prix du conditionnement divisé par sa capacité.
    priceUsd: prices.usd,
    priceCdf: prices.cdf,
    materialCostUsd: divider ? prices.usd / divider : 0,
    materialCostCdf: divider ? prices.cdf / divider : 0,
  };
}
