import type { ApiProduct } from '@/lib/api';

/**
 * Returns the purchase limit for a product, or null when quantity tracking is
 * not configured. A product without a configured quantity is treated as
 * unavailable until an admin enters stock; this prevents unlimited sales.
 */
export function getStockLimit(product: Pick<ApiProduct, 'stock_qty' | 'stock_status'>): number | null {
  const status = String(product.stock_status ?? '').trim().toLowerCase();
  if (status === 'out_of_stock') return 0;

  const rawQuantity = product.stock_qty;
  if (rawQuantity === null || rawQuantity === undefined || String(rawQuantity).trim() === '') return 0;
  const quantity = Number(rawQuantity);
  if (!Number.isFinite(quantity)) return null;
  return Math.max(0, Math.floor(quantity));
}

export function getRemainingStock(
  product: Pick<ApiProduct, 'stock_qty' | 'stock_status'>,
  quantityAlreadyInCart = 0,
): number | null {
  const limit = getStockLimit(product);
  return limit === null ? null : Math.max(0, limit - Math.max(0, Number(quantityAlreadyInCart) || 0));
}

export function isProductInStock(product: Pick<ApiProduct, 'stock_qty' | 'stock_status'>): boolean {
  const limit = getStockLimit(product);
  return limit !== null && limit > 0;
}
