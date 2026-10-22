// FILE PATH: src/components/CartDrawer.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/data/shopData';
import { getStockLimit } from '@/lib/inventory';

const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cart, removeFromCart, updateQuantity, cartTotal, cartCount,
    isCartOpen, setIsCartOpen, clearCart,
    blockedMessage, clearBlockedMessage, refreshCartStock,
  } = useCart();
  const [checkingStock, setCheckingStock] = useState(false);
  const currency = cart[0]?.currency;
  const storeConflict = /store/i.test(blockedMessage ?? '');

  useEffect(() => {
    if (!isCartOpen || cart.length === 0) return;
    setCheckingStock(true);
    refreshCartStock().finally(() => setCheckingStock(false));
  }, [isCartOpen]);

  const handleCheckout = async () => {
    setCheckingStock(true);
    const valid = await refreshCartStock();
    setCheckingStock(false);
    if (!valid) return;
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-1 bg-[#E02020]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-montserrat font-bold text-lg text-gray-900">Your Cart</h2>
            {cartCount > 0 && (
              <span className="bg-[#E02020] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={() => { setIsCartOpen(false); clearBlockedMessage(); }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Blocked Message Banner ── */}
        {blockedMessage && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#E02020] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-montserrat font-bold text-sm text-gray-900 mb-1">{storeConflict ? "Can't mix stores" : 'Stock limit reached'}</p>
                <p className="font-poppins text-xs text-gray-600 leading-relaxed">{blockedMessage}</p>
                {storeConflict && <button
                  onClick={() => { clearCart(); clearBlockedMessage(); }}
                  className="mt-3 bg-[#E02020] text-white font-montserrat font-bold text-xs px-4 py-2 uppercase tracking-wide hover:bg-[#c01a1a] transition-colors"
                >
                  Clear Cart & Switch Store
                </button>}
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 && !blockedMessage ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-9 h-9 text-[#E02020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-montserrat font-bold text-gray-800">Cart is empty</p>
                <p className="font-poppins text-sm text-gray-400 mt-1">Browse and add items</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-[#E02020] text-white font-montserrat font-bold px-6 py-2.5 text-sm uppercase tracking-wide hover:bg-[#c01a1a] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 py-4">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&q=80'}
                    alt={item.name}
                    className="w-16 h-16 object-cover flex-shrink-0 rounded bg-gray-50"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&q=80'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins font-semibold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="font-poppins text-xs text-[#E02020] font-semibold mt-0.5">{item.category}</p>
                    {/* Country badge */}
                    <span className="inline-block text-[10px] font-poppins text-gray-400 mt-0.5">
                      {item.country === 'NG' ? '🇳🇬 Nigeria Store' : '🇨🇦 Canada Store'}
                    </span>
                    <p className={`text-[10px] font-semibold mt-1 ${getStockLimit(item) === 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {getStockLimit(item) === 0 ? 'Out of stock' : getStockLimit(item) === null ? 'Stock available' : `${getStockLimit(item)} available in stock`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#E02020] hover:text-[#E02020] transition-colors font-bold rounded"
                      >−</button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={getStockLimit(item) !== null && item.quantity >= getStockLimit(item)!}
                        aria-label={`Increase ${item.name} quantity`}
                        className="w-6 h-6 border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#E02020] hover:text-[#E02020] transition-colors font-bold rounded disabled:cursor-not-allowed disabled:opacity-40"
                      >+</button>
                    </div>
                    {item.stock_qty != null && <p className="mt-1 text-[10px] text-gray-500">{item.stock_qty} available in stock</p>}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-[#E02020] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="font-montserrat font-bold text-sm text-gray-900">
                      {formatPrice(item.price * item.quantity, item.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-1">
              <span className="font-poppins text-sm text-gray-500">Subtotal</span>
              <span className="font-montserrat font-extrabold text-xl text-gray-900">
                {currency && formatPrice(cartTotal, currency)}
              </span>
            </div>
            <p className="font-poppins text-xs text-gray-400 mb-4">Shipping calculated at checkout</p>
            <button
              onClick={handleCheckout}
              disabled={checkingStock}
              className="w-full bg-[#E02020] text-white font-montserrat font-bold py-3.5 uppercase tracking-widest text-sm hover:bg-[#c01a1a] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-wait"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {checkingStock ? 'Checking stock…' : 'Proceed to Checkout'}
            </button>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full text-center font-poppins text-sm text-gray-400 hover:text-gray-700 mt-2.5 transition-colors"
            >
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
