// FILE PATH: src/pages/Shop.tsx
import { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
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
import heroContainers from '@/assets/shop-hero-containers.webp';
import heroWarehouse from '@/assets/shop-hero-warehouse.webp';
import heroPort from '@/assets/shop-hero-port.webp';

const NIGERIA_SLIDES = [
  { image: heroContainers, tag: 'Power & Commerce', headline: 'Products\nFor Nigerian Business', sub: 'Browse the products currently available in the Nigeria marketplace.', cta: 'Shop Now', category: '' },
  { image: heroWarehouse, tag: 'Construction', headline: 'Build With\nConfidence', sub: 'Practical tools and materials available for Nigerian delivery.', cta: 'Shop Now', category: 'construction-materials' },
  { image: heroPort, tag: 'Fast Fulfilment', headline: 'Order With\nClarity', sub: 'Transparent stock status and delivery details before payment.', cta: 'Shop Now', category: '' },
];

const CANADA_SLIDES = [
  { image: heroPort, tag: 'Mining Equipment', headline: 'Precision Tools\nFor Canadian Mining', sub: 'Diamond core bits, hydraulic splitters and GPR systems for demanding operations.', cta: 'Shop Now', category: 'ca-mining-equipment' },
  { image: heroWarehouse, tag: 'Industrial Supplies', headline: 'Heavy-Duty\nIndustrial Equipment', sub: 'Air compressors, welding machines and industrial supplies for Canadian workshops.', cta: 'Shop Now', category: 'ca-industrial' },
];

// ── Hero Slider ───────────────────────────────────────────────────────────────
const HeroSlider = ({
  slides,
  onCategoryClick,
}: {
  slides: typeof NIGERIA_SLIDES;
  onCategoryClick: (cat: string) => void;
}) => {
  const [current, setCurrent] = useState<number>(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timer.current = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer.current);
  }, [slides.length]);

  const s = slides[current];

  return (
    <div className="relative h-[250px] sm:h-[320px] md:h-[560px] overflow-hidden bg-gray-900">
      <img src={s.image} alt={s.tag} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-700"/>
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"/>
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <span className="inline-block bg-[#E02020] text-white text-xs font-bold px-3 py-1 uppercase tracking-widest mb-4 font-montserrat">{s.tag}</span>
          <h1 className="font-montserrat font-black text-4xl md:text-6xl text-white leading-tight mb-4 whitespace-pre-line">{s.headline}</h1>
          <p className="font-poppins text-white/80 text-base md:text-lg max-w-xl mb-8">{s.sub}</p>
          <button
            onClick={() => onCategoryClick(s.category)}
            className="bg-[#E02020] text-white font-montserrat font-bold px-8 py-4 text-sm uppercase tracking-widest hover:bg-[#c01a1a] transition-colors">
            {s.cta} →
          </button>
        </div>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i: number) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/40'}`}/>
        ))}
      </div>
    </div>
  );
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
        <HeroSlider
          slides={slides}
          onCategoryClick={(cat: string) => {
            setSelectedCategory(cat);
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
        />
      </div>

      {isNigeria && <NigeriaShopPromoBanner />}

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
              <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
