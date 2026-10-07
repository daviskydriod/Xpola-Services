// FILE PATH: src/components/shop/ProductGrid.tsx
// Place this file at: src/components/shop/ProductGrid.tsx
import { ApiProduct } from '@/lib/api';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: ApiProduct[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
  selectedCategory: string;
}

const ProductGrid = ({
  products,
  onClearFilters,
  hasActiveFilters,
  totalCount,
  filteredCount,
  selectedCategory,
}: ProductGridProps) => {
  // ── Empty state ──
  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-8 h-8 text-[#E02020]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="font-montserrat font-bold text-gray-800 text-xl">No products found</p>
        <p className="font-poppins text-sm text-gray-400 mt-1">
          Try adjusting your search or filters
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="mt-5 bg-[#E02020] text-white font-montserrat font-bold px-6 py-3 hover:bg-[#c01a1a] text-sm uppercase tracking-wide transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Result meta */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-gray-500 font-poppins">
          Showing{' '}
          <span className="font-bold text-gray-900">{filteredCount}</span>
          {' '}of{' '}
          <span className="font-bold text-gray-900">{totalCount}</span> products
          {selectedCategory !== 'All' && (
            <>
              {' · '}
              <span className="text-[#E02020] font-semibold">{selectedCategory}</span>
            </>
          )}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-[#E02020] font-semibold font-poppins hover:underline flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
