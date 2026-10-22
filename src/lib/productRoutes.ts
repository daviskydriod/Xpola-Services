import type { ApiProduct } from './api';

/** Converts a product name to the public, stable-looking URL slug used by the shop. */
export function slugifyProductName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Use the prerendered country path for Nigeria and the existing ID route elsewhere. */
export function productDetailPath(product: Pick<ApiProduct, 'id' | 'name' | 'country'>): string {
  if (product.country === 'NG') {
    return `/nigeria/shop/${slugifyProductName(product.name)}`;
  }
  return `/shop/product/${product.id}`;
}
