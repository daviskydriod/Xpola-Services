// FILE PATH: src/pages/Shop.tsx
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Clock3, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Tag, Truck } from 'lucide-react';
import { usePageMeta, pageMeta } from '@/hooks/usePageMeta';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCountry } from '../contexts/CountryContext';
import { useCart } from '../contexts/CartContext';
import { useShop } from '@/hooks/useShop';
import { ApiProduct, catalogueApi } from '@/lib/api';
import SharedProductCard from '@/components/shop/ProductCard';
import NigeriaShopPromoBanner from '@/components/shop/NigeriaShopPromoBanner';
import ShopElectronicsShowcase from '@/components/shop/ShopElectronicsShowcase';
import heroContainers from '@/assets/stock-sources/service-commerce.webp';
import heroWarehouse from '@/assets/stock-sources/service-logistics.webp';
import heroPort from '@/assets/stock-sources/service-oil-gas.webp';
import shopElectronicsStore from '@/assets/stock-sources/shop-electronics-store.webp';
import shopConstructionSupplies from '@/assets/stock-sources/shop-construction-supplies.webp';
import nigeriaMarketRetail from '@/assets/stock-sources/nigeria-market-retail.webp';

type ShopSlide = { image: string; tag: string; headline: string; sub: string; cta: string; category: string };
const NIGERIA_SLIDES: ShopSlide[] = [
  { image: shopElectronicsStore, tag: 'Electronics and equipment', headline: 'Business essentials\nfor Nigeria', sub: 'Shop practical products for work, construction, operations, and everyday business needs.', cta: 'Browse products', category: '' },
  { image: shopConstructionSupplies, tag: 'Tools and supplies', headline: 'Build with\nconfidence', sub: 'Find useful tools and materials with clear stock status before you order.', cta: 'Shop construction', category: 'construction-materials' },
  { image: nigeriaMarketRetail, tag: 'Local marketplace', headline: 'Shop with\nlocal context', sub: 'See product details, available quantity, and delivery information in one place.', cta: 'See all products', category: '' },
];
const CANADA_SLIDES: ShopSlide[] = [
  { image: heroPort, tag: 'Canada marketplace', headline: 'Industrial products\nfor Canadian teams', sub: 'Explore the Canada catalogue for mining, workshops, operations, and supply enquiries.', cta: 'Browse products', category: '' },
  { image: heroWarehouse, tag: 'Operational supplies', headline: 'Equipment for\nserious work', sub: 'Find practical equipment and supplies for Canadian business requirements.', cta: 'View catalogue', category: '' },
];
const HeroSlider = ({ slides, onCategoryClick, search, onSearch }: { slides: ShopSlide[]; onCategoryClick: (cat: string) => void; search: string; onSearch: (value: string) => void }) => {
  const [current, setCurrent] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => {
    timer.current = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5500);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [slides.length]);
  const slide = slides[current];
  return <section className="relative overflow-hidden bg-[#171717]">
    <div className="relative h-[390px] sm:h-[440px] lg:h-[500px]">
      <img src={slide.image} alt={slide.tag} width={1800} height={1200} loading={current === 0 ? 'eager' : 'lazy'} fetchPriority={current === 0 ? 'high' : 'auto'} decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-55 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-8 lg:px-10"><div className="max-w-2xl text-white">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#E02020] px-3 py-1.5 font-montserrat text-[10px] font-bold uppercase tracking-[0.18em]"><Sparkles className="h-3.5 w-3.5" />{slide.tag}</p>
        <h1 className="whitespace-pre-line font-montserrat text-4xl font-black leading-[1.02] sm:text-5xl lg:text-7xl">{slide.headline}</h1>
        <p className="mt-5 max-w-xl font-poppins text-sm leading-6 text-white/80 sm:text-base">{slide.sub}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => onCategoryClick(slide.category)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E02020] px-6 py-3 font-montserrat text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c71b1b]">{slide.cta}<ChevronRight className="h-4 w-4" /></button><a href="#shop-catalogue" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 font-montserrat text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10">Explore catalogue</a></div>
      </div></div>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">{slides.map((item, i) => <button key={item.tag} type="button" aria-label={`Show promotion ${i + 1}`} onClick={() => setCurrent(i)} className={`h-2 rounded-full ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/45'}`} />)}</div>
    </div>
    <div className="relative z-20 mx-auto -mt-7 max-w-5xl px-4 sm:px-8"><label className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/10"><Search className="ml-3 h-5 w-5 shrink-0 text-gray-400" /><input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search for products, tools, equipment…" className="min-w-0 flex-1 bg-transparent px-1 py-3 font-poppins text-sm text-gray-900 outline-none placeholder:text-gray-400" /><button type="button" onClick={() => document.getElementById('shop-catalogue')?.scrollIntoView({ behavior: 'smooth' })} className="hidden rounded-lg bg-[#E02020] px-6 py-3 font-montserrat text-xs font-bold uppercase tracking-wider text-white sm:block">Search</button></label></div>
  </section>;
};
const ShopBenefits = ({ isNigeria }: { isNigeria: boolean }) => {
  const market = isNigeria ? 'Nigeria' : 'Canada';
  const benefits = [{ icon: Truck, title: 'Delivery support', text: `Delivery guidance for ${market}` }, { icon: ShieldCheck, title: 'Secure checkout', text: 'Protected account and payment flow' }, { icon: Tag, title: 'Clear pricing', text: 'See currency and stock before ordering' }, { icon: Clock3, title: 'Responsive support', text: 'Talk to the Xpola team when needed' }];
  return <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 lg:grid-cols-4">{benefits.map(item => <div key={item.title} className="flex items-center gap-3 bg-white px-4 py-4 sm:px-6"><item.icon className="h-5 w-5 shrink-0 text-[#E02020]" /><div><p className="font-montserrat text-xs font-bold text-gray-900">{item.title}</p><p className="mt-0.5 font-poppins text-xs text-gray-500">{item.text}</p></div></div>)}</div>;
};
// ── Product Card ──────────────────────────────────────────────────────────────
// ── Main Shop Page ────────────────────────────────────────────────────────────
export default function Shop() {
  const { currentData } = useCountry();
  const country = currentData.code as 'NG' | 'CA';
  const isNigeria = country === 'NG';
  usePageMeta(...Object.values(pageMeta.shop(isNigeria ? 'nigeria' : 'canada')));

  const {
    products, categories, loading, error, pagination,
    page, setPage,
    search, setSearch,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy,
    showInStock, setShowInStock,
    hasFilters, clearFilters,
  } = useShop(country);

  const slides = isNigeria ? NIGERIA_SLIDES : CANADA_SLIDES;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catalogueMode, setCatalogueMode] = useState<'sample' | 'live'>('sample');
  useEffect(() => {
    catalogueApi.getStatus().then(data => setCatalogueMode(data.mode)).catch(() => setCatalogueMode('sample'));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar/>

      <div className="pt-[72px]">
        <HeroSlider slides={slides} onCategoryClick={(cat: string) => { setSelectedCategory(cat); setPage(1); document.getElementById('shop-catalogue')?.scrollIntoView({ behavior: 'smooth' }); }} search={search} onSearch={value => { setSearch(value); setPage(1); }} />
      </div>

      {isNigeria && <NigeriaShopPromoBanner />}
      <ShopElectronicsShowcase />

      <main id="shop-catalogue" className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-montserrat font-black text-2xl md:text-3xl text-gray-900 uppercase tracking-widest">
              <span className="inline-flex items-center gap-2"><img src={isNigeria ? '/flags/ng.svg' : '/flags/ca.svg'} alt="" className="w-6 h-4 object-cover" />{isNigeria ? 'Nigeria Shop' : 'Canada Shop'}</span>
            </h2>
            {catalogueMode === 'sample' && <p className="font-poppins text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 max-w-2xl">
              Sample catalogue for demonstration. Staff can replace, add, categorise and update products from the private dashboard when the approved catalogue is ready.
            </p>}
            {pagination && <p className="font-poppins text-sm text-gray-400 mt-1">{pagination.total} {selectedCategory ? "matching products" : "products"}</p>}
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="font-poppins text-sm text-[#E02020] hover:underline">
              Clear all filters
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <button onClick={() => setFiltersOpen(v => !v)} className="lg:hidden flex items-center justify-center gap-2 w-full border border-gray-200 bg-white px-4 py-3 font-montserrat font-bold text-xs uppercase tracking-widest text-gray-800"><SlidersHorizontal className="w-4 h-4" /> Filters {hasFilters ? "(active)" : ""}</button>
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block lg:w-56 flex-shrink-0 space-y-6`}>
            <div>
              <p className="font-montserrat font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Search</p>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products…"
                className="w-full px-3 py-2 border border-gray-200 text-sm font-poppins focus:outline-none focus:border-[#E02020] transition-colors"
              />
            </div>

            <div>
              <p className="font-montserrat font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Category</p>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory(''); setPage(1); }}
                  className={`w-full text-left font-poppins text-sm px-2 py-1.5 transition-colors ${!selectedCategory ? 'text-[#E02020] font-semibold' : 'text-gray-600 hover:text-[#E02020]'}`}>
                  All Categories
                </button>
                {categories.map(c => (
                  <button key={c.id}
                    onClick={() => { setSelectedCategory(c.slug); setPage(1); }}
                    className={`w-full text-left font-poppins text-sm px-2 py-1.5 transition-colors ${selectedCategory === c.slug ? 'text-[#E02020] font-semibold' : 'text-gray-600 hover:text-[#E02020]'}`}>
                    {c.name} <span className="text-gray-400">({c.product_count ?? 0})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-montserrat font-bold text-xs uppercase tracking-widest text-gray-500 mb-2">Sort By</p>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                className="w-full appearance-none px-3 py-2 border border-gray-200 text-sm font-poppins text-gray-900 font-semibold focus:outline-none focus:border-[#E02020] bg-white">
                <option value="newest">Newest</option>
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInStock}
                onChange={e => { setShowInStock(e.target.checked); setPage(1); }}
                className="w-4 h-4 accent-[#E02020]"
              />
              <span className="font-poppins text-sm text-gray-600">In Stock Only</span>
            </label>
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i: number) => (
                  <div key={i} className="bg-white border border-gray-100 animate-pulse">
                    <div className="bg-gray-100" style={{ paddingBottom: '68%' }}/>
                    <div className="p-4 space-y-2">
                      <div className="h-2 bg-gray-100 rounded w-1/3"/>
                      <div className="h-3 bg-gray-100 rounded"/>
                      <div className="h-3 bg-gray-100 rounded w-2/3"/>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="font-poppins text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#E02020] text-white font-montserrat font-bold px-6 py-3 text-sm uppercase tracking-widest hover:bg-[#c01a1a] transition-colors">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-poppins text-gray-500 mb-2">No products found.</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="font-poppins text-sm text-[#E02020] hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((p: ApiProduct) => <SharedProductCard key={p.id} product={p}/>)}
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-200 font-montserrat font-bold text-xs uppercase tracking-widest text-gray-600 hover:border-[#E02020] hover:text-[#E02020] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      ← Prev
                    </button>
                    {Array.from({ length: pagination.last_page }, (_: unknown, i: number) => i + 1)
                      .filter((pageNum: number) => Math.abs(pageNum - page) <= 2)
                      .map((pageNum: number) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 font-montserrat font-bold text-xs border transition-colors ${
                            page === pageNum
                              ? 'bg-[#E02020] text-white border-[#E02020]'
                              : 'border-gray-200 text-gray-600 hover:border-[#E02020] hover:text-[#E02020]'
                          }`}>
                          {pageNum}
                        </button>
                      ))}
                    <button
                      onClick={() => setPage(prev => Math.min(pagination.last_page, prev + 1))}
                      disabled={page === pagination.last_page}
                      className="px-4 py-2 border border-gray-200 font-montserrat font-bold text-xs uppercase tracking-widest text-gray-600 hover:border-[#E02020] hover:text-[#E02020] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer/>
    </div>
  );
}
