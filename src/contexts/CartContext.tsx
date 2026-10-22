// FILE PATH: src/contexts/CartContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiProduct, apiFetch } from '@/lib/api';
import { getStockLimit } from '@/lib/inventory';

export interface CartItem extends ApiProduct {
  image: string;
  category: ReactNode;
  quantity: number;
}

interface CartContextType {
  cart:                CartItem[];
  addToCart:           (product: ApiProduct, quantity?: number) => boolean;
  removeFromCart:      (id: number) => void;
  updateQuantity:      (id: number, quantity: number) => void;
  clearCart:           () => void;
  refreshCartStock:    () => Promise<boolean>;
  cartTotal:           number;
  cartCount:           number;
  currency:            string;
  isCartOpen:          boolean;
  setIsCartOpen:       (open: boolean) => void;
  blockedMessage:      string | null;
  clearBlockedMessage: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('xpola_cart') || '[]'); }
    catch { return []; }
  });
  const [isCartOpen,     setIsCartOpen]     = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('xpola_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: ApiProduct, requestedQuantity = 1): boolean => {
    const quantity = Math.max(1, Math.floor(Number(requestedQuantity) || 1));

    // Block mixing Nigeria & Canada items.
    if (cart.length > 0 && cart[0].country !== product.country) {
      const cartFlag = cart[0].country === 'NG' ? '🇳🇬 Nigeria' : '🇨🇦 Canada';
      const itemFlag = product.country === 'NG' ? '🇳🇬 Nigeria' : '🇨🇦 Canada';
      setBlockedMessage(`You have items from the ${cartFlag} store. Clear your cart to add items from ${itemFlag}.`);
      setIsCartOpen(true);
      return false;
    }

    const stockLimit = getStockLimit(product);
    if (product.stock_status !== 'in_stock' || stockLimit === 0) {
      setBlockedMessage(`${product.name} is out of stock and cannot be added.`);
      setIsCartOpen(true);
      return false;
    }

    const inCart = cart.find(item => item.id === product.id)?.quantity ?? 0;
    if (stockLimit !== null && inCart + quantity > stockLimit) {
      const remaining = Math.max(0, stockLimit - inCart);
      setBlockedMessage(remaining === 0
        ? `You already have all ${stockLimit} available unit${stockLimit === 1 ? '' : 's'} of ${product.name} in your cart.`
        : `Only ${remaining} more unit${remaining === 1 ? '' : 's'} of ${product.name} can be added. Available stock: ${stockLimit}.`);
      setIsCartOpen(true);
      return false;
    }

    setBlockedMessage(null);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id
        ? { ...item, ...product, quantity: item.quantity + quantity }
        : item);
      const newItem: CartItem = {
        ...product,
        image: product.image_path || '',
        category: product.category_name || '',
        quantity,
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: number, requestedQuantity: number) => {
    if (requestedQuantity <= 0) { removeFromCart(id); return; }
    const item = cart.find(entry => entry.id === id);
    if (!item) return;
    const stockLimit = getStockLimit(item);
    if (stockLimit === 0) {
      setBlockedMessage(`${item.name} is out of stock. Remove it from your cart to continue.`);
      return;
    }
    const quantity = stockLimit === null
      ? Math.max(1, Math.floor(requestedQuantity))
      : Math.min(stockLimit, Math.max(1, Math.floor(requestedQuantity)));
    if (stockLimit !== null && requestedQuantity > stockLimit) {
      setBlockedMessage(`Only ${stockLimit} unit${stockLimit === 1 ? '' : 's'} of ${item.name} are available. The quantity has been capped.`);
    } else {
      setBlockedMessage(null);
    }
    setCart(prev => prev.map(entry => entry.id === id ? { ...entry, quantity } : entry));
  };
  const refreshCartStock = async (): Promise<boolean> => {
    if (cart.length === 0) return true;
    let valid = true;
    let message = '';
    const refreshed = await Promise.all(cart.map(async item => {
      try {
        const response = await apiFetch<{ data: ApiProduct }>(`/products.php?id=${item.id}`);
        const product = response.data;
        const limit = getStockLimit(product);
        if (limit === 0) {
          valid = false;
          message = `${item.name} is out of stock and was removed from your cart.`;
          return null;
        }
        const quantity = limit === null ? item.quantity : Math.min(item.quantity, limit);
        if (quantity < item.quantity) {
          valid = false;
          message = `Only ${limit} unit${limit === 1 ? '' : 's'} of ${item.name} are available. Your cart was adjusted.`;
        }
        return { ...item, ...product, image: product.image_path || item.image, category: product.category_name || item.category, quantity };
      } catch {
        return item;
      }
    }));
    setCart(refreshed.filter((item): item is CartItem => item !== null));
    if (message) setBlockedMessage(message);
    return valid;
  };
  const clearCart = () => { setCart([]); localStorage.removeItem('xpola_cart'); };
  const clearBlockedMessage = () => setBlockedMessage(null);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currency = cart[0]?.currency ?? 'NGN';

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, refreshCartStock,
      cartTotal, cartCount, currency,
      isCartOpen, setIsCartOpen,
      blockedMessage, clearBlockedMessage,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
