// FILE PATH: src/contexts/AdminContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { adminApi, adminProductsApi, ordersApi, ApiProduct, Order, normalizeOrderStatus } from '@/lib/api';

export type AdminOrder = Order & {
  items: NonNullable<Order['items']>;
  customer_email?: string;
  customer_phone?: string;
  country?: 'NG' | 'CA';
  total_amount?: number;
};

interface AdminContextType {
  adminToken:      string | null;
  isAuthenticated: boolean;
  isSuperAdmin:    boolean;
  username:        string;
  login:           (username: string, password: string) => Promise<{ otpRequired: boolean; tempToken?: string }>;
  verifyOtp:       (tempToken: string, otp: string) => Promise<boolean>;
  logout:          () => void;
  orders:          AdminOrder[];
  ordersLoading:   boolean;
  fetchOrders:     (params?: string) => Promise<void>;
  updateOrderStatus: (id: number, status: AdminOrder['status']) => Promise<void>;
  deleteOrder:     (id: number) => Promise<void>;
  products:        ApiProduct[];
  productsLoading: boolean;
  fetchProducts:   () => Promise<void>;
  createProduct:   (fd: FormData) => Promise<void>;
  updateProduct:   (fd: FormData) => Promise<void>;
  deleteProduct:   (id: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [adminToken,    setAdminToken]    = useState<string | null>(() => localStorage.getItem('xpola_admin_token'));
  const [isSuperAdmin,  setIsSuperAdmin]  = useState<boolean>(() => localStorage.getItem('xpola_admin_super') === '1');
  const [username,      setUsername]      = useState<string>(() => localStorage.getItem('xpola_admin_name') ?? '');
  const [orders,        setOrders]        = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [products,      setProducts]      = useState<ApiProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const isAuthenticated = !!adminToken;

  const _storeSession = (token: string, name: string, superAdmin: boolean) => {
    setAdminToken(token);
    setUsername(name);
    setIsSuperAdmin(superAdmin);
    localStorage.setItem('xpola_admin_token', token);
    localStorage.setItem('xpola_admin_name',  name);
    localStorage.setItem('xpola_admin_super',  superAdmin ? '1' : '0');
  };

  const login = async (user: string, password: string): Promise<{ otpRequired: boolean; tempToken?: string }> => {
    const res = await adminApi.login(user, password);
    if (res.otpRequired) {
      return { otpRequired: true, tempToken: res.tempToken };
    }
    if (res.token) {
      _storeSession(res.token, res.username ?? user, res.isSuperAdmin ?? false);
    }
    return { otpRequired: false };
  };

  const verifyOtp = async (tempToken: string, otp: string): Promise<boolean> => {
    const res = await adminApi.verifyOtp(tempToken, otp);
    if (res.token) {
      _storeSession(res.token, res.username, res.isSuperAdmin ?? false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setAdminToken(null); setUsername(''); setIsSuperAdmin(false);
    localStorage.removeItem('xpola_admin_token');
    localStorage.removeItem('xpola_admin_name');
    localStorage.removeItem('xpola_admin_super');
    setOrders([]); setProducts([]);
  };

  const fetchOrders = async (params?: string) => {
    setOrdersLoading(true);
    try {
      const res = await ordersApi.getAll(params);
      const raw = (res as any).data ?? res;
      setOrders((Array.isArray(raw) ? raw : []).map((o: Order) => ({
        ...o,
        status: normalizeOrderStatus(o),
        items: o.items ?? [],
      })) as AdminOrder[]);
    } catch (e) { console.error('Failed to fetch orders:', e); }
    finally { setOrdersLoading(false); }
  };

  const updateOrderStatus = async (id: number, status: AdminOrder['status']) => {
    await ordersApi.updateStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOrder = async (id: number) => {
    await ordersApi.delete(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await adminProductsApi.getAll();
      setProducts(res.data ?? []);
    } catch (e) { console.error('Failed to fetch products:', e); }
    finally { setProductsLoading(false); }
  };

  const createProduct = async (fd: FormData) => { await adminProductsApi.create(fd); await fetchProducts(); };
  const updateProduct = async (fd: FormData) => { await adminProductsApi.update(fd); await fetchProducts(); };
  const deleteProduct = async (id: number)   => { await adminProductsApi.delete(id); setProducts(prev => prev.filter(p => p.id !== id)); };

  return (
    <AdminContext.Provider value={{
      adminToken, isAuthenticated, isSuperAdmin, username, login, verifyOtp, logout,
      orders, ordersLoading, fetchOrders, updateOrderStatus, deleteOrder,
      products, productsLoading, fetchProducts, createProduct, updateProduct, deleteProduct,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
