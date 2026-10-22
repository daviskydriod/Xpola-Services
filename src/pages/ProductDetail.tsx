// FILE PATH: src/pages/ProductDetail.tsx
// KEY FIX: WishlistButton now uses useAuth() context (isInWishlist, addToWishlist, removeFromWishlist)
// instead of its own broken apiFetch calls.
// Also: shows multiple product images as gallery + variations selection.

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, ApiProduct, ProductVariation, productImageUrl, formatPrice } from '@/lib/api';
import { usePageMeta, pageMeta } from '@/hooks/usePageMeta';
import { slugifyProductName } from '@/lib/productRoutes';
import { getRemainingStock, isProductInStock } from '@/lib/inventory';

// ── Wishlist Button — uses AuthContext, NOT raw apiFetch ──────────────────────
const WishlistButton = ({ productId }: { productId: number }) => {
  const { user, isInWishlist, addToWishlist, removeFromWishlist, wishlist } = useAuth();
  const [loading, setLoading] = useState(false);

  const wishlisted = isInWishlist(String(productId));
  // Find the wishlist item id (needed for removal)
  const wishlistItem = wishlist.find(w => w.productId === String(productId));

  const toggle = async () => {
    if (!user) { window.location.href = '/login'; return; }
    setLoading(true);
    try {
      if (wishlisted && wishlistItem) {
        await removeFromWishlist(wishlistItem.id);
      } else {
        await addToWishlist(String(productId));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`w-12 h-12 flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
        wishlisted ? 'border-[#E02020] bg-red-50 text-[#E02020]' : 'border-gray-200 text-gray-400 hover:border-[#E02020] hover:text-[#E02020]'
      }`}
    >
      <svg className={`w-5 h-5 transition-all ${loading ? 'opacity-40' : ''}`}
        fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
};

const Spinner = () => (
  <div className="flex items-center justify-center py-32">
    <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  </div>
);

const Stars = ({ rating, reviews }: { rating: number; reviews: number }) => (
  <div className="flex items-center gap-1.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="font-poppins text-sm text-gray-500">{rating.toFixed(1)} ({reviews} reviews)</span>
  </div>
);

// Group variations by type
function groupVariations(variations: ProductVariation[]): Record<string, ProductVariation[]> {
  return variations.reduce((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {} as Record<string, ProductVariation[]>);
}

export default function ProductDetail() {
  const { id, slug } = useParams<'id' | 'slug'>();
  const routeToken = id ?? slug;
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen, cart } = useCart();

  const [product,  setProduct]  = useState<ApiProduct | null>(null);
  const [related,  setRelated]  = useState<ApiProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [qty,      setQty]      = useState(1);
  const [adding,   setAdding]   = useState(false);
  const [added,    setAdded]    = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState<'description'|'specs'|'shipping'>('description');
  // Selected variations: { type: variationId }
  const [selectedVars, setSelectedVars] = useState<Record<string, number>>({});
  const productMeta = product ? pageMeta.product(product.name, product.price, product.currency) : undefined;
  usePageMeta(productMeta?.title, productMeta?.description);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setProduct(null);
    setRelated([]);

    const loadProduct = async () => {
      if (!routeToken) throw new Error('Product not found.');

      let productId = routeToken;
      if (!/^\d+$/.test(routeToken)) {
        const catalogue = await apiFetch<{ data: ApiProduct[] }>('/products.php?country=NG&per_page=100');
        const match = catalogue.data.find(item => slugifyProductName(item.name) === routeToken);
        if (!match) throw new Error('Product not found.');
        productId = String(match.id);
      }

      const result = await apiFetch<{ data: ApiProduct }>(`/products.php?id=${encodeURIComponent(productId)}`);
      if (cancelled) return;
      setProduct(result.data);
      setActiveImg(0);

      if (result.data.category_id) {
        apiFetch<{ data: ApiProduct[] }>(`/products.php?country=${result.data.country}&category=${result.data.category_slug}&per_page=4`)
          .then(response => {
            if (!cancelled) setRelated(response.data.filter(item => item.id !== result.data.id).slice(0, 4));
          })
          .catch(() => {});
      }
    };

    loadProduct()
      .catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to load this product.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [routeToken]);

  // Build all images: primary image_path + product_images[]
  const allImages = (() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.image_path) imgs.push(productImageUrl(product.image_path));
    (product.images ?? []).forEach(img => {
      const url = productImageUrl(img.image_path);
      if (!imgs.includes(url)) imgs.push(url);
    });
    if (imgs.length === 0) imgs.push(productImageUrl(null));
    return imgs;
  })();

  // Price delta from selected variations
  const priceDelta = Object.values(selectedVars).reduce((sum, varId) => {
    const v = (product?.variations ?? []).find(v => v.id === varId);
    return sum + (v?.price_delta ?? 0);
  }, 0);

  const effectivePrice = (product?.price ?? 0) + priceDelta;
  const productCartQuantity = product ? (cart.find(item => item.id === product.id)?.quantity ?? 0) : 0;
  const remainingStock = product ? getRemainingStock(product, productCartQuantity) : null;
  const productAvailable = !!product && isProductInStock(product);
  const canAddMore = productAvailable && (remainingStock === null || remainingStock > 0);

  useEffect(() => {
    if (remainingStock !== null) setQty(current => Math.max(1, Math.min(current, Math.max(1, remainingStock))));
  }, [remainingStock]);

  const handleAddToCart = () => {
    if (!product || !canAddMore || (remainingStock !== null && qty > remainingStock)) return;
    setAdding(true);
    if (!addToCart(product, qty)) { setAdding(false); return; }
    setAdded(true);
    setIsCartOpen(true);
    setTimeout(() => { setAdding(false); setAdded(false); }, 1500);
  };

  const shopPath = product?.country === 'NG' ? '/nigeria/shop' : '/canada/shop';

  if (loading) return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 pt-[72px]"><Spinner /></div><Footer /></div>;
  if (error || !product) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-[72px] flex items-center justify-center text-center px-4">
        <div>
          <p className="font-poppins text-gray-500 mb-4">{error || 'Product not found.'}</p>
          <button onClick={() => navigate(-1)} className="bg-[#E02020] text-white font-montserrat font-bold px-6 py-3 text-sm uppercase tracking-widest hover:bg-[#c01a1a] transition-colors">Go Back</button>
        </div>
      </div>
      <Footer />
    </div>
  );

  const variationGroups = groupVariations(product.variations ?? []);

  const productSchema = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description, image: allImages, brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined, offers: { '@type': 'Offer', priceCurrency: product.currency, price: effectivePrice, availability: productAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: window.location.href } };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Navbar />
      <div className="pt-[72px] h-1 bg-[#E02020]" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-poppins text-xs text-gray-400 mb-8">
          <Link to={shopPath} className="hover:text-[#E02020] transition-colors">Shop</Link>
          <span>/</span>
          {product.category_name && (
            <><Link to={`${shopPath}/categories?category=${product.category_slug}`} className="hover:text-[#E02020] transition-colors">{product.category_name}</Link><span>/</span></>
          )}
          <span className="text-gray-700 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* ── Image Gallery ── */}
          <div className="space-y-3">
            <div className="relative overflow-hidden border border-gray-100 bg-gray-50" style={{ paddingBottom: '72%' }}>
              <img src={allImages[activeImg] ?? productImageUrl(null)} alt={product.name}
                className="absolute inset-0 h-full w-full object-contain p-4 sm:p-6"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80'; }} />
              {product.featured === 1 && (
                <span className="absolute top-4 left-4 bg-[#E02020] text-white text-xs font-bold px-3 py-1 uppercase tracking-widest font-montserrat">Featured</span>
              )}
            </div>
            {/* Thumbnails — shown when more than 1 image */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 border-2 overflow-hidden bg-gray-50 transition-colors ${activeImg === i ? 'border-[#E02020]' : 'border-gray-200 hover:border-gray-400'}`}>
                    <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full bg-gray-50 p-1 object-contain"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=60'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-[#E02020] uppercase tracking-widest font-poppins">{product.category_name}</span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-gray-400 font-poppins inline-flex items-center gap-1"><img src={product.country === 'NG' ? '/flags/ng.svg' : '/flags/ca.svg'} alt="" className="w-4 h-3 object-cover" />{product.country === 'NG' ? 'Nigeria' : 'Canada'}</span>
            </div>

            <h1 className="font-montserrat font-black text-3xl text-gray-900 leading-tight mb-4">{product.name}</h1>

            {product.reviews > 0 && <div className="mb-4"><Stars rating={product.rating} reviews={product.reviews} /></div>}

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-montserrat font-black text-4xl text-gray-900">{formatPrice(effectivePrice, product.currency)}</span>
              {priceDelta !== 0 && (
                <span className="text-sm text-gray-400 font-poppins">
                  ({priceDelta > 0 ? '+' : ''}{formatPrice(priceDelta, product.currency)} for selected option)
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${productAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`font-poppins text-sm font-semibold ${productAvailable ? 'text-green-600' : 'text-red-500'}`}>
                {productAvailable ? (remainingStock === null ? 'In Stock' : `${remainingStock} available to add`) : 'Out of Stock'}
              </span>
            </div>

            {/* ── Variations ── */}
            {Object.keys(variationGroups).length > 0 && (
              <div className="mb-6 space-y-4">
                {Object.entries(variationGroups).map(([type, options]) => (
                  <div key={type}>
                    <p className="font-montserrat font-bold text-xs uppercase tracking-widest text-gray-700 mb-2 capitalize">
                      {type}
                      {selectedVars[type] && (
                        <span className="ml-2 text-[#E02020] font-mono normal-case tracking-normal">
                          — {options.find(o => o.id === selectedVars[type])?.value}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options.map(opt => (
                        <button key={opt.id}
                          onClick={() => setSelectedVars(prev =>
                            prev[type] === opt.id ? { ...prev, [type]: 0 } : { ...prev, [type]: opt.id }
                          )}
                          className={`px-3 py-1.5 border-2 text-xs font-bold font-poppins transition-colors ${
                            selectedVars[type] === opt.id
                              ? 'border-[#E02020] bg-red-50 text-[#E02020]'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          } ${opt.stock_qty === 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                          disabled={opt.stock_qty === 0}>
                          {opt.value}
                          {opt.price_delta !== 0 && (
                            <span className="ml-1 text-[10px] opacity-70">
                              ({opt.price_delta > 0 ? '+' : ''}{formatPrice(opt.price_delta, product.currency)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Qty + Add */}
            {productAvailable && remainingStock !== 0 && (
              <div className="flex gap-3 mb-6">
                <div className="flex items-center border border-gray-200">
                  <button onClick={() => setQty(q => Math.max(1, q-1))} disabled={qty <= 1} className="w-10 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold disabled:opacity-40">−</button>
                  <span className="w-10 h-12 flex items-center justify-center font-montserrat font-bold text-gray-900">{qty}</span>
                  <button onClick={() => setQty(q => remainingStock === null ? q+1 : Math.min(remainingStock, q+1))} disabled={remainingStock !== null && qty >= remainingStock} className="w-10 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold disabled:opacity-40">+</button>
                </div>
                <button onClick={handleAddToCart} disabled={adding || !canAddMore || (remainingStock !== null && qty > remainingStock)}
                  className={`flex-1 font-montserrat font-bold text-sm uppercase tracking-widest py-3 transition-all disabled:cursor-not-allowed disabled:bg-gray-300 ${added ? 'bg-green-500 text-white' : 'bg-[#E02020] text-white hover:bg-[#c01a1a]'}`}>
                  {added ? '✓ Added to Cart!' : adding ? 'Adding…' : 'Add to Cart'}
                </button>
              </div>
            )}
            {productAvailable && remainingStock === 0 && (
              <p className="mb-6 rounded border border-amber-200 bg-amber-50 px-4 py-3 font-poppins text-sm text-amber-800">
                You already have the available stock in your cart.
              </p>
            )}

            <div className="flex gap-3 mb-8">
              <Link to="/checkout" className="flex-1 block text-center border-2 border-gray-900 text-gray-900 font-montserrat font-bold py-3 text-sm uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors">
                Buy Now
              </Link>
              <WishlistButton productId={product.id} />
            </div>

            {/* Tabs */}
            <div className="border-t border-gray-100">
              <div className="flex">
                {(['description','specs','shipping'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 font-montserrat font-bold text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-colors ${activeTab===tab ? 'border-[#E02020] text-[#E02020]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                    <span className="sm:hidden">{tab === 'description' ? 'Desc' : tab === 'specs' ? 'Specs' : 'Ship'}</span>
                    <span className="hidden sm:inline">{tab === 'description' ? 'Description' : tab === 'specs' ? 'Specifications' : 'Shipping'}</span>
                  </button>
                ))}
              </div>
              <div className="py-5 font-poppins text-sm text-gray-600 leading-relaxed">
                {activeTab === 'description' && <div className="space-y-3"><div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description || product.summary || 'No description available.' }} />{product.brand && <p><strong>Brand:</strong> {product.brand}</p>}{product.warranty && <p><strong>Warranty:</strong> {product.warranty}</p>}</div>}
                {activeTab === 'specs' && (
                  <div className="space-y-2">
                    {[
                      ['Category', product.category_name ?? '—'],
                      ['Country', product.country === 'NG' ? 'Nigeria' : 'Canada'],
                      ['Currency', product.currency],
                      ['Stock', productAvailable ? (remainingStock !== null && remainingStock <= 5 ? `Only ${remainingStock} left` : 'Available') : 'Out of stock'],
                      ...(product.specifications ? [['Details', product.specifications]] : []),
                      ...(product.brand ? [['Brand', product.brand]] : []),
                      ...(product.warranty ? [['Warranty', product.warranty]] : []),
                      ...(product.tags ? [['Tags', product.tags]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-4">
                        <span className="font-semibold text-gray-700 w-24 flex-shrink-0">{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'shipping' && (
                  <div className="space-y-3">
                    <p>✓ Lagos: typically 1–2 business days; other Nigerian regions: typically 2–5 business days.</p>
                    <p>✓ Delivery fee is calculated only after your address/area is entered and shown in final order review.</p>
                    <p>✓ Paystack cards, bank transfer and USSD are supported. Pay-on-delivery may be arranged for eligible areas.</p>
                    <p>✓ <a className="text-[#E02020] underline" href="https://wa.me/2347086275105">Order via WhatsApp</a> for bulk or assisted orders.</p>
                    <p>✓ Orders processed within 24 hours of payment confirmation.</p>
                    <p>✓ Contact us for bulk orders or special delivery requirements.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="font-montserrat font-black text-xl text-gray-900 uppercase tracking-widest mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => (
                <Link key={p.id} to={`/shop/product/${p.id}`} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}
                  className="group bg-white border border-gray-100 hover:border-red-200 hover:shadow-md transition-all flex flex-col">
                  <div className="relative overflow-hidden bg-gray-50" style={{paddingBottom:'72%'}}>
                    <img src={productImageUrl(p.image_path)} alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e=>{(e.target as HTMLImageElement).src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80';}} />
                  </div>
                  <div className="p-3">
                    <p className="font-montserrat font-bold text-gray-900 text-xs line-clamp-2 mb-1">{p.name}</p>
                    <p className="font-montserrat font-extrabold text-sm text-gray-900">{formatPrice(p.price, p.currency)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
