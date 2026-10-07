// FILE PATH: src/components/shop/ProductCard.tsx
// Place this file at: src/components/shop/ProductCard.tsx
import { useState } from 'react';
import { formatPrice, ApiProduct } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: ApiProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (product.stock_status !== 'in_stock') return;
    setAdding(true);
    addToCart(product);
    setTimeout(() => setAdding(false), 900);
  };

  return (
    <div className="group bg-white border border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* ── Image ── */}
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingBottom: '62%' }}>
        <img
          src={product.image_path || ''}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80';
          }}
        />

        {/* Featured ribbon */}
        {product.featured === 1 && (
          <span className="absolute top-2 left-0 bg-[#E02020] text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 uppercase tracking-wider font-montserrat">
            Featured
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock_status !== 'in_stock' && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-[9px] sm:text-xs font-bold px-3 py-1.5 uppercase tracking-widest font-montserrat">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1">
        {/* Category label */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="w-2.5 h-0.5 bg-[#E02020]" />
          <span className="text-[9px] sm:text-[10px] font-semibold text-[#E02020] uppercase tracking-wider font-poppins truncate">
            {product.category_name || ''}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-montserrat font-bold text-gray-900 text-xs sm:text-sm leading-snug mb-1.5 line-clamp-2">
          {product.name}
        </h3>

        {/* Description — hidden on very small screens to reduce clutter */}
        <p className="hidden sm:block font-poppins text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 flex-1">
          {product.description}
        </p>

        {/* Star rating */}
        <div className="flex items-center gap-1 mb-2.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-poppins">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-2.5 border-t border-gray-100 gap-2 min-w-0">
          <div className="min-w-0">
            <p className="font-montserrat font-extrabold text-sm sm:text-base md:text-lg text-gray-900 leading-tight break-words">
              {formatPrice(product.price, product.currency)}
            </p>
            <p
              className={`text-[9px] sm:text-[10px] font-poppins font-semibold mt-0.5 ${
                product.stock_status === 'in_stock' ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {product.stock_status === 'in_stock' ? '● In Stock' : '○ Out of Stock'}
            </p>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stock_status !== 'in_stock' || adding}
            className={`w-full sm:w-auto font-montserrat font-bold text-[9px] sm:text-[10px] px-2.5 sm:px-3.5 py-2 uppercase tracking-wide transition-all duration-200 flex-shrink-0 whitespace-nowrap ${
              product.stock_status !== 'in_stock'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : adding
                ? 'bg-green-500 text-white'
                : 'bg-[#E02020] text-white hover:bg-[#c01a1a]'
            }`}
          >
            {adding ? '✓' : '+ Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
