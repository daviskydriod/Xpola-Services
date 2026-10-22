import { useState } from 'react';
import { Link } from 'react-router-dom';
import { productImageUrl, formatPrice, ApiProduct } from '@/lib/api';
import { productDetailPath } from '@/lib/productRoutes';
import { useCart } from '@/contexts/CartContext';
import { getRemainingStock } from '@/lib/inventory';

interface ProductCardProps {
  product: ApiProduct;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80';

function cardSummary(product: ApiProduct): string {
  const raw = product.summary?.trim() || product.description?.trim() || '';
  const readable = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
  if (readable.length <= 92) return readable;
  return `${readable.slice(0, 89).trimEnd()}…`;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, cart } = useCart();
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(false);
  const detailPath = productDetailPath(product);
  const inCart = cart.find(item => item.id === product.id)?.quantity ?? 0;
  const remaining = getRemainingStock(product, inCart);
  const unavailable = product.stock_status !== 'in_stock' || remaining === 0;
  const stockLabel = product.stock_status !== 'in_stock'
    ? 'Out of stock'
    : remaining === 0
      ? 'Available limit in cart'
      : remaining !== null && remaining <= 5
        ? `Only ${remaining} left to add`
        : 'In stock';

  const handleAdd = () => {
    if (unavailable || adding) return;
    setAdding(true);
    if (!addToCart(product)) { setAdding(false); return; }
    window.setTimeout(() => setAdding(false), 900);
  };

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:border-gray-300 hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-white">
          <Link to={detailPath} aria-label={`View ${product.name} details`} className="block h-full w-full p-3">
            <img
              src={productImageUrl(product.image_path)}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              onError={event => { event.currentTarget.src = FALLBACK_IMAGE; }}
            />
          </Link>

          {product.featured === 1 && (
            <span className="absolute left-3 top-3 rounded-sm bg-[#E02020] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Featured
            </span>
          )}
          {unavailable && (
            <span className="absolute bottom-3 left-3 rounded-sm bg-gray-900/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
              {product.stock_status !== 'in_stock' || Number(product.stock_qty) === 0 ? 'Out of stock' : 'Limit in cart'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="absolute right-3 top-3 rounded-sm border border-gray-200 bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 shadow-sm transition hover:text-[#E02020]"
          >
            Quick view
          </button>
        </div>

        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <div className="mb-1.5 flex min-h-4 items-center gap-2">
            <span className="h-0.5 w-3 shrink-0 bg-[#E02020]" />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {product.category_name || 'Product'}
            </span>
          </div>

          <Link to={detailPath} className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E02020]">
            <h3 className="line-clamp-2 min-h-10 font-montserrat text-sm font-semibold leading-5 text-gray-900 transition-colors hover:text-[#C51D1D]">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex min-h-7 items-baseline gap-2">
            <p className="whitespace-nowrap font-montserrat text-lg font-extrabold leading-tight tabular-nums text-gray-900">
              {formatPrice(product.price, product.currency)}
            </p>
          </div>

          <div className="mt-1 flex min-h-5 items-center gap-1.5 text-[11px] text-gray-500">
            <span aria-label={`${product.rating} out of 5 stars`} className="flex gap-px text-amber-400">
              {[0, 1, 2, 3, 4].map(index => (
                <svg key={index} className={`h-3.5 w-3.5 ${index < Math.floor(Number(product.rating || 0)) ? '' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.923-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.195-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69z" />
                </svg>
              ))}
            </span>
            <span>{Number(product.rating || 0).toFixed(1)}</span>
            <span className="text-gray-300">·</span>
            <span>{product.reviews || 0} reviews</span>
          </div>

          <p className="product-card-summary mt-2 min-h-10 text-xs leading-5 text-gray-500">
            {cardSummary(product)}
          </p>

          <div className="mt-auto pt-3">
            <p className={`mb-2 text-[11px] font-medium ${product.stock_status === 'in_stock' ? 'text-green-700' : 'text-gray-400'}`}>
              <span aria-hidden="true">●</span> {stockLabel}
            </p>
            <button
              type="button"
              onClick={handleAdd}
              disabled={unavailable || adding}
              className={`w-full rounded-md px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                unavailable
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : adding
                    ? 'bg-green-600 text-white'
                    : 'bg-[#E02020] text-white hover:bg-[#BD1B1B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E02020] focus-visible:ring-offset-2'
              }`}
            >
              {adding ? 'Added to cart' : unavailable ? 'Stock limit reached' : 'Add to cart'}
            </button>
            <Link to={detailPath} className="mt-2 inline-flex w-full items-center justify-center gap-1 py-1 text-xs font-semibold text-[#B91C1C] hover:underline">
              View details <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </article>

      {preview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view ${product.name}`}
          onClick={() => setPreview(false)}
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl sm:p-6" onClick={event => event.stopPropagation()}>
            <div className="flex gap-4">
              <img
                src={productImageUrl(product.images?.[0]?.image_path || product.image_path)}
                alt={product.name}
                className="h-24 w-24 shrink-0 rounded-lg bg-gray-50 p-1 object-contain sm:h-32 sm:w-32"
                onError={event => { event.currentTarget.src = FALLBACK_IMAGE; }}
              />
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{product.category_name || 'Product'}</p>
                <h2 className="font-montserrat text-base font-bold text-gray-900 sm:text-lg">{product.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{cardSummary(product)}</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{formatPrice(product.price, product.currency)}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={() => setPreview(false)} className="rounded-md border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              <Link to={detailPath} onClick={() => setPreview(false)} className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-center text-sm font-bold text-gray-800 hover:border-[#E02020] hover:text-[#B91C1C]">View product details</Link>
              <button type="button" onClick={handleAdd} disabled={unavailable || adding} className="flex-1 rounded-md bg-[#E02020] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#BD1B1B] disabled:cursor-not-allowed disabled:bg-gray-300">{adding ? 'Added' : unavailable ? 'Stock limit reached' : 'Add to cart'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
