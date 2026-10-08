// FILE PATH: src/pages/admin/AdminDashboard.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { adminApi, maintenanceApi, ordersApi, customersApi, deliveryApi, categoriesApi, couponsApi, commsApi, supportApi, adminNotificationsApi, AdminStats, Order, Customer, StockNotificationsResponse, AdminUser, DeliveryZone, Category, Coupon, SiteSettings, AnnouncementBanner, AuditLog, SupportTicket } from '@/lib/api';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminRestock from './AdminRestock';
import AdminNotifications from './AdminNotifications';
import { toast } from '@/hooks/use-toast';

export type AdminView = 'overview' | 'products' | 'orders' | 'notifications' | 'restock' | 'customers' | 'comms' | 'settings' | 'maintenance';

// ── Helpers ───────────────────────────────────────────────────────────────────

const APP_URL = (import.meta.env.VITE_APP_URL ?? 'https://xpolaservices.com').replace(/\/$/, '');
function resolveImg(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return APP_URL + path;
}

const toArray = <T,>(data: any, ...keys: string[]): T[] => {
  if (Array.isArray(data)) return data as T[];
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as T[];
  }
  return [];
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ path, className = 'w-5 h-5' }: { path: string | string[]; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {(Array.isArray(path) ? path : [path]).map((d, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    ))}
  </svg>
);

const ICONS = {
  overview: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  products: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  notifications: 'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-3.5 13a2.5 2.5 0 01-5 0',
  restock: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  orders: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  customers: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  comms: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  maintenance: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  logout: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

const NAV_ITEMS: { id: AdminView; label: string; icon: string }[] = [
  { id: 'overview',    label: 'Overview',    icon: ICONS.overview },
  { id: 'products',    label: 'Products',    icon: ICONS.products },
  { id: 'orders',      label: 'Orders',      icon: ICONS.orders },
  { id: 'notifications', label: 'Notifications', icon: ICONS.notifications },
  { id: 'restock',     label: 'Restock alerts', icon: ICONS.restock },
  { id: 'customers',   label: 'Customers',   icon: ICONS.customers },
  { id: 'comms',       label: 'Comms',       icon: ICONS.comms },
  { id: 'settings',    label: 'Settings',    icon: ICONS.settings },
  { id: 'maintenance', label: 'Maintenance', icon: ICONS.maintenance },
];

const BOTTOM_TABS: { id: AdminView; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Home',     icon: ICONS.overview },
  { id: 'products',  label: 'Products', icon: ICONS.products },
  { id: 'orders',    label: 'Orders',   icon: ICONS.orders },
  { id: 'customers', label: 'People',   icon: ICONS.customers },
  { id: 'settings',  label: 'Settings', icon: ICONS.settings },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ view, setView, onLogout, isOpen, onClose, pendingOrders, pendingNotifications }: {
  view: AdminView; setView: (v: AdminView) => void;
  onLogout: () => void; isOpen: boolean; onClose: () => void; pendingOrders: number; pendingNotifications: number;
}) => {
  const content = (
    <aside className="w-64 bg-gray-900 h-screen flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#E02020] rounded-lg flex items-center justify-center">
            <Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-montserrat font-bold text-white text-sm">Xpola Admin</p>
            <p className="text-gray-500 text-xs">Management Portal</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
          <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              view === item.id
                ? item.id === 'maintenance' ? 'bg-orange-500 text-white' : 'bg-[#E02020] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}>
            <Icon path={item.icon} className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
            {item.id === 'orders' && pendingOrders > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                {pendingOrders > 9 ? '9+' : pendingOrders}
              </span>
            )}
            {item.id === 'notifications' && pendingNotifications > 0 && (
              <span className="ml-auto bg-yellow-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{pendingNotifications > 9 ? '9+' : pendingNotifications}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <a href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
          <Icon path="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="w-4 h-4" />
          View Website
        </a>
        <button onClick={onLogout} className="w-full flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-all">
          <Icon path={ICONS.logout} className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block flex-shrink-0 sticky top-0 h-screen">{content}</div>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{content}</div>
        </>
      )}
    </>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────
const Overview = ({ setView }: { setView: (v: AdminView) => void }) => {
  const [stats,     setStats]     = useState<AdminStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<StockNotificationsResponse | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats()
        .then((data: any) => setStats(data?.stats ?? data ?? null)),
      customersApi.getAll()
        .then(data => setCustomers(toArray<Customer>(data, 'customers', 'data').slice(0, 5)))
        .catch(() => {}),
      adminNotificationsApi.get()
        .then(data => setNotifications(data.data))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const statusStyle: Record<string, string> = {
    pending:    'bg-blue-100 text-blue-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped:    'bg-purple-100 text-purple-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-600',
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  if (!stats) return <p className="text-gray-500 text-sm">Failed to load stats.</p>;

  const statCards = [
    { label: 'Total Products', value: String(stats.totalProducts ?? 0), color: 'bg-green-500',   icon: ICONS.products },
    { label: 'Total Orders', value: String(stats.totalOrders ?? 0),     color: 'bg-blue-500',    icon: ICONS.orders },
    { label: 'Customers',    value: String(stats.totalCustomers ?? 0),  color: 'bg-purple-500',  icon: ICONS.customers },
    { label: 'Revenue',   value: `₦${(stats.totalRevenue ?? 0).toLocaleString()}`, color: 'bg-[#E02020]', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const revenueChart = toArray<any>(stats.recentOrders, 'recentOrders');
  const topProducts  = toArray<any>(stats.recentOrders,  'recentOrders');
  const recentOrders = toArray<any>(stats.recentOrders, 'recentOrders').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin.</p>
      </div>

      {/* 6 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${card.color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon path={card.icon} className="w-4 h-4 text-white" />
            </div>
            <p className="font-montserrat font-extrabold text-lg text-gray-900 leading-tight">{card.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Orders — 5 max, link to orders tab */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-bold text-gray-900 text-sm uppercase tracking-wider">Recent Orders</h2>
            <button onClick={() => setView('orders')} className="text-xs text-[#E02020] font-semibold hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No orders yet.</p>
            ) : recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{order.customerName}</p>
                  <p className="text-xs text-gray-400">{String(order.createdAt ?? '').slice(0, 10)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {order.currency === 'CAD' ? 'CA$' : '₦'}{(order.total ?? 0).toLocaleString()}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setView('orders')}
            className="mt-4 w-full bg-[#E02020] text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-red-700 transition-colors">
            Go to Orders (with pagination) →
          </button>
        </div>

        {/* Recent Customers — 5 max, link to customers tab */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-montserrat font-bold text-gray-900 text-sm uppercase tracking-wider">Recent Customers</h2>
            <button onClick={() => setView('customers')} className="text-xs text-[#E02020] font-semibold hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {customers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No customers yet.</p>
            ) : customers.map((c: Customer) => (
              <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-700">{c.totalOrders} orders</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setView('customers')}
            className="mt-4 w-full bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-xl text-xs hover:bg-gray-200 transition-colors">
            Go to Customers (with pagination) →
          </button>
        </div>
      </div>
      {notifications && (notifications.total > 0 ? (
        <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-montserrat font-bold text-gray-900 text-sm uppercase tracking-wider">Stock notifications</h2><p className="text-xs text-gray-500 mt-1">Items requiring stock or customer-request attention.</p></div><button onClick={() => setView('notifications')} className="text-xs text-[#E02020] font-semibold hover:underline">Open notifications →</button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="bg-yellow-50 rounded-xl p-3"><p className="text-xl font-bold text-yellow-700">{notifications.lowStock.length}</p><p className="text-xs font-semibold text-yellow-800">Low-stock products</p></div><div className="bg-red-50 rounded-xl p-3"><p className="text-xl font-bold text-red-700">{notifications.outOfStock.length}</p><p className="text-xs font-semibold text-red-800">Out-of-stock products</p></div><button onClick={() => setView('restock')} className="text-left bg-blue-50 rounded-xl p-3 hover:bg-blue-100"><p className="text-xl font-bold text-blue-700">{notifications.restockRequests}</p><p className="text-xs font-semibold text-blue-800">Restock requests →</p></button></div>
        </div>
      ) : <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm font-semibold text-green-800">No stock notifications at this time.</div>)}
    </div>
  );
};

// ── Customers Panel ───────────────────────────────────────────────────────────
const CUSTOMERS_PER_PAGE = 6;

const CustomersPager = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
  const lastPage = Math.ceil(total / CUSTOMERS_PER_PAGE);
  if (lastPage <= 1) return null;
  const pages = Array.from({ length: Math.min(lastPage, 5) }, (_, i) =>
    lastPage <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, lastPage - 4)) + i
  );
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
      <p className="text-xs text-gray-400">
        {((page - 1) * CUSTOMERS_PER_PAGE) + 1}–{Math.min(page * CUSTOMERS_PER_PAGE, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 text-xs font-bold">‹</button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold
              ${p === page ? 'bg-[#E02020] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === lastPage}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 text-xs font-bold">›</button>
      </div>
    </div>
  );
};

const CustomersPanel = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<Customer | null>(null);
  const [tagFilter, setTagFilter]  = useState('all');
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    customersApi.getAll()
      .then(data => setCustomers(toArray<Customer>(data, 'customers', 'data')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, tagFilter]);

  const filtered = customers.filter(c => {
    const matchSearch = !search || `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase());
    const matchTag    = tagFilter === 'all' || (c.tags ?? []).includes(tagFilter);
    return matchSearch && matchTag;
  });

  const paginated = filtered.slice((page - 1) * CUSTOMERS_PER_PAGE, page * CUSTOMERS_PER_PAGE);

  const handleTag = async (id: string, tag: string) => {
    const customer  = customers.find(c => c.id === id);
    if (!customer) return;
    const currentTags = customer.tags ?? [];
    const newTags     = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
    await customersApi.updateTag(id, newTags);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, tags: newTags } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, tags: newTags } : prev);
  };

  const handleBlock = async (id: string, status: 'active' | 'suspended') => {
    await customersApi.setStatus(id, status);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this user? Their order history will be preserved but anonymised.')) return;
    await customersApi.deleteUser(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSelected(null);
  };

  const TAG_OPTIONS = ['VIP', 'Repeat Buyer', 'At Risk', 'New'];
  const TAG_COLORS: Record<string, string> = {
    'VIP':          'bg-yellow-100 text-yellow-700',
    'Repeat Buyer': 'bg-green-100 text-green-700',
    'At Risk':      'bg-red-100 text-red-600',
    'New':          'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm">{customers.length} registered users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020]" />
        </div>
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#E02020]">
          <option value="all">All Tags</option>
          {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Customer', 'Country', 'Orders', 'Spent', 'Tags', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.country === 'NG' ? '🇳🇬' : '🇨🇦'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{c.totalOrders}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">₦{(c.totalSpent ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.tags ?? []).map(tag => (
                            <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(c)} className="text-xs font-semibold text-[#E02020] hover:underline">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <CustomersPager page={page} total={filtered.length} onChange={setPage} />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {paginated.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4" onClick={() => setSelected(c)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{c.totalOrders} orders</span>
                  <span>·</span>
                  <span className="font-bold text-gray-700">₦{(c.totalSpent ?? 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
            <CustomersPager page={page} total={filtered.length} onChange={setPage} />
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-montserrat font-bold text-gray-900">{selected.firstName} {selected.lastName}</h2>
                <p className="text-xs text-gray-400">{selected.email} · {selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">
                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Orders',  value: selected.totalOrders },
                  { label: 'Spent',   value: `₦${(selected.totalSpent ?? 0).toLocaleString()}` },
                  { label: 'Country', value: selected.country === 'NG' ? '🇳🇬 NG' : '🇨🇦 CA' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button key={tag} onClick={() => handleTag(selected.id, tag)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all ${
                        (selected.tags ?? []).includes(tag)
                          ? (TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600') + ' border-current'
                          : 'border-gray-200 text-gray-400'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleBlock(selected.id, selected.status === 'active' ? 'suspended' : 'active')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    selected.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}>
                  {selected.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(selected.email)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                  Copy Email
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <button onClick={() => handleDelete(selected.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                  <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-4 h-4" />
                  Delete Account Permanently
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1.5">Order history will be anonymised and preserved.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Support Tickets Admin ─────────────────────────────────────────────────────
const SupportTicketsAdmin = () => {
  const [tickets,   setTickets]   = useState<SupportTicket[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<SupportTicket | null>(null);
  const [reply,     setReply]     = useState('');
  const [replying,  setReplying]  = useState(false);
  const [replySent, setReplySent] = useState(false);

  useEffect(() => {
    commsApi.adminSupportAll()
      .then(data => {
        const arr = Array.isArray(data) ? data : ((data as any).tickets ?? []);
        setTickets(arr.map((t: any) => ({
          ...t,
          messages: t.messages ?? t.replies ?? [],
          replies:  t.messages ?? t.replies ?? [],
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    try {
      await commsApi.adminSupportReply(selected.id, reply.trim(), 'in_progress');
      const newMsg = { id: Date.now().toString(), sender: 'admin' as const, body: reply.trim(), createdAt: new Date().toISOString() };
      setSelected(prev => prev ? {
        ...prev,
        status: 'in_progress',
        messages: [...(prev.messages ?? []), newMsg],
        replies:  [...(prev.replies  ?? []), newMsg],
      } : prev);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'in_progress' } : t));
      setReply('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 3000);
    } catch (e) { console.error('Reply failed:', e); }
    finally { setReplying(false); }
  };

  const handleResolve = async () => {
    if (!selected) return;
    try {
      await commsApi.adminSupportReply(selected.id, 'Ticket resolved.', 'resolved');
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'resolved' } : t));
      setSelected(null);
    } catch (e) { console.error('Resolve failed:', e); }
  };

  const statusColors: Record<string, string> = {
    open:        'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved:    'bg-green-100 text-green-700',
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-3">
      {tickets.length === 0 ? (
        <p className="text-center text-gray-500 py-8 font-semibold">No support tickets yet.</p>
      ) : (
        tickets.map(t => (
          <div key={t.id}
            className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:border-[#E02020] transition-colors"
            onClick={() => setSelected(t)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-gray-900">{t.subject}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.reference} · {t.category}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {String(t.status).replace('_', ' ')}
              </span>
            </div>
          </div>
        ))
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-montserrat font-bold text-gray-900 text-sm">{selected.subject}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selected.reference} · {selected.category}</p>
                {(selected as any).customerName && (
                  <p className="text-xs text-gray-400 mt-0.5">Customer: {(selected as any).customerName}</p>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">
                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Chat thread — scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: '50vh', minHeight: '200px' }}>
              {/* Show messages (backend returns messages key) */}
              {((selected.messages ?? selected.replies ?? []) as any[]).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No messages in this ticket yet.</p>
              ) : ((selected.messages ?? selected.replies ?? []) as any[]).map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === 'admin' ? 'bg-[#E02020] text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${msg.sender === 'admin' ? 'text-red-200' : 'text-gray-500'}`}>
                      {msg.sender === 'admin' ? 'Support Agent' : 'Customer'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.sender === 'admin' ? 'text-red-200' : 'text-gray-400'}`}>
                      {(msg.created_at ?? msg.createdAt ?? '').slice(0, 16).replace('T', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 space-y-4 border-t border-gray-100">
              {/* Reply box — only if not resolved */}
              {selected.status !== 'resolved' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                      Your Reply
                    </label>
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      rows={4}
                      placeholder="Type your reply…"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E02020] resize-none bg-white"
                    />
                  </div>

                  {replySent && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                      <Icon path="M5 13l4 4L19 7" className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 font-semibold">Reply sent!</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleReply}
                      disabled={replying || !reply.trim()}
                      className="flex-1 bg-[#E02020] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {replying
                        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Sending…</>
                        : 'Send Reply'}
                    </button>
                    <button
                      onClick={handleResolve}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                      Resolve ✓
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-green-700 font-semibold">✓ This ticket has been resolved</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Communications Panel ──────────────────────────────────────────────────────
const CommsPanel = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-gray-900">Communications</h1>
        <p className="text-gray-500 text-sm">Handle customer support tickets</p>
      </div>

      {/*
      ── BROADCAST EMAIL — commented out for now ──────────────────────────────
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-montserrat font-bold text-gray-800">Send Broadcast Email</h2>
        <select audience ... />
        <input subject ... />
        <textarea body ... />
        <button>Send Email Broadcast</button>
      </div>
      ─────────────────────────────────────────────────────────────────────────

      ── ANNOUNCEMENT BANNER — commented out for now ──────────────────────────
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        Banner text, link, color, expiry inputs...
      </div>
      ───────────────────────────────────────────────────────────────────────── */}

      <SupportTicketsAdmin />
    </div>
  );
};

// ── Settings Panel ────────────────────────────────────────────────────────────
const SettingsPanel = () => {
  const { isSuperAdmin, username } = useAdmin();
  const [tab, setTab] = useState<'delivery' | 'categories' | 'coupons' | 'security' | 'audit' | 'admins'>('delivery');

  const TABS = [
    { id: 'delivery',   label: 'Delivery Zones' },
    { id: 'categories', label: 'Categories' },
    { id: 'coupons',    label: 'Coupons' },
    { id: 'security',   label: 'Security' },
    // Only super admins see Audit Log and Admin Users
    ...(isSuperAdmin ? [
      { id: 'audit',  label: '🔍 Audit Log' },
      { id: 'admins', label: '👥 Admin Users' },
    ] : []),
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage delivery zones, categories, coupons and site config</p>
      </div>
      <div className="flex overflow-x-auto bg-gray-100 rounded-xl p-1 gap-1 no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'delivery'   && <DeliveryZonesManager />}
      {tab === 'categories' && <CategoriesManager />}
      {tab === 'coupons'    && <CouponsManager />}
      {tab === 'security'   && <SecurityPanel />}
      {tab === 'audit'      && isSuperAdmin && <AuditLogPanel />}
      {tab === 'admins'     && isSuperAdmin && <AdminUsersPanel />}
    </div>
  );
};

// ── Delivery Zones Manager ────────────────────────────────────────────────────
const DeliveryZonesManager = () => {
  const [zones,   setZones]   = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DeliveryZone> | null>(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    deliveryApi.adminGetAll()
      .then(data => setZones(toArray<DeliveryZone>(data, 'zones', 'data')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await deliveryApi.update(editing.id, editing);
        setZones(prev => prev.map(z => z.id === editing.id ? { ...z, ...editing } as DeliveryZone : z));
      } else {
        const { id } = await deliveryApi.create(editing as Omit<DeliveryZone, 'id'>);
        setZones(prev => [...prev, { ...editing, id } as DeliveryZone]);
      }
      setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delivery zone?')) return;
    await deliveryApi.delete(id);
    setZones(prev => prev.filter(z => z.id !== id));
  };

  const handleToggle = async (zone: DeliveryZone) => {
    await deliveryApi.update(zone.id, { active: !zone.isActive } as any);
    setZones(prev => prev.map(z => z.id === zone.id ? { ...z, isActive: !z.isActive } : z));
  };

  const emptyZone = { name: '', country: 'NG', fee: 0, min_days: 1, max_days: 7 };
  const sym = (country: string) => country === 'CA' ? 'CA$' : '₦';

  if (loading) return (
    <div className="flex justify-center py-8">
      <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{zones.length} delivery areas configured</p>
        <button onClick={() => setEditing(emptyZone)}
          className="flex items-center gap-2 bg-[#E02020] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">
          <Icon path="M12 4v16m8-8H4" className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {editing && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-montserrat font-bold text-sm text-gray-900">
            {editing.id ? 'Edit Zone' : 'New Delivery Zone'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Area / City</label>
              <input type="text" value={editing.area ?? ''} onChange={e => setEditing(prev => ({ ...prev, area: e.target.value }))}
                placeholder="e.g. Lagos Island"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">State / Province</label>
              <input type="text" value={(editing as any).state ?? ''} onChange={e => setEditing(prev => ({ ...prev, state: e.target.value } as Partial<DeliveryZone>))}
                placeholder="e.g. Lagos State"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Country</label>
              <select value={editing.country ?? 'NG'} onChange={e => setEditing(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-[#E02020]">
                <option value="NG">🇳🇬 Nigeria (NGN)</option>
                <option value="CA">🇨🇦 Canada (CAD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                Fee ({sym(editing.country ?? 'NG')})
              </label>
              <input type="number" min={0} value={editing.fee ?? 0} onChange={e => setEditing(prev => ({ ...prev, fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-[#E02020] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Area', 'State', 'Country', 'Fee', 'Active', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {zones.map(zone => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{zone.area ?? zone.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{(zone as any).state ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{zone.country === 'CA' ? '🇨🇦 CA' : '🇳🇬 NG'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{sym(zone.country)}{(zone.fee ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(zone)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors bg-green-500`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform translate-x-5`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing({ ...zone })} className="text-xs text-[#E02020] font-semibold hover:underline">Edit</button>
                      <button onClick={() => handleDelete(zone.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Categories Manager ────────────────────────────────────────────────────────
const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState<Partial<Category> | null>(null);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    categoriesApi.adminGetAll()
      .then(data => setCategories(toArray<Category>(data, 'categories', 'data')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing?.name || !editing?.slug) return;
    setSaving(true);
    try {
      if (editing.id) {
        await categoriesApi.update(editing.id, editing);
        setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...editing } as Category : c));
      } else {
        const { id } = await categoriesApi.create(editing as Omit<Category, 'id'>);
        setCategories(prev => [...prev, { ...editing, id } as Category]);
      }
      setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete category? Products in this category will become uncategorized.')) return;
    await categoriesApi.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} categories</p>
        <button onClick={() => setEditing({ name: '', slug: '' })}
          className="flex items-center gap-2 bg-[#E02020] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">
          <Icon path="M12 4v16m8-8H4" className="w-4 h-4" /> Add Category
        </button>
      </div>

      {editing && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-montserrat font-bold text-sm text-gray-900">{editing.id ? 'Edit Category' : 'New Category'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Name</label>
              <input type="text" value={editing.name ?? ''} onChange={e => setEditing(prev => ({ ...prev, name: e.target.value, slug: prev?.slug || e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="e.g. Oil & Gas Supplies"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Slug</label>
              <input type="text" value={editing.slug ?? ''} onChange={e => setEditing(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="oil-gas-supplies"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Country</label>
              <select value={(editing as any).country ?? 'NG'} onChange={e => setEditing(prev => ({ ...prev, country: e.target.value as 'NG' | 'CA' }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-[#E02020]">
                <option value="NG">🇳🇬 Nigeria</option>
                <option value="CA">🇨🇦 Canada</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !editing.name || !editing.slug}
              className="flex-1 bg-[#E02020] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-900">{cat.name}</p>
              <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing({ ...cat })} className="text-xs text-[#E02020] font-semibold hover:underline">Edit</button>
              <button onClick={() => handleDelete(cat.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Coupons Manager ───────────────────────────────────────────────────────────
const CouponsManager = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    couponsApi.adminGetAll()
      .then(data => setCoupons(toArray<Coupon>(data, 'coupons', 'data')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!editing?.code || !editing?.value) return;
    setSaving(true);
    try {
      if (editing.id) {
        await couponsApi.update(editing.id, editing);
        setCoupons(prev => prev.map(c => c.id === editing.id ? { ...c, ...editing } as Coupon : c));
      } else {
        const { id } = await couponsApi.create({ ...editing, usedCount: 0 } as Omit<Coupon, 'id' | 'usedCount'>);
        setCoupons(prev => [...prev, { ...editing, id, usedCount: 0 } as Coupon]);
      }
      setEditing(null);
    } finally { setSaving(false); }
  };

  const handleToggle = async (coupon: Coupon) => {
    await couponsApi.update(coupon.id, { isActive: !coupon.isActive });
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{coupons.length} coupon codes</p>
        <button onClick={() => setEditing({ code: '', type: 'percent', value: 0, isActive: true })}
          className="flex items-center gap-2 bg-[#E02020] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">
          <Icon path="M12 4v16m8-8H4" className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {editing && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-montserrat font-bold text-sm text-gray-900">{editing.id ? 'Edit Coupon' : 'New Coupon'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Code</label>
              <input type="text" value={editing.code ?? ''} onChange={e => setEditing(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Type</label>
              <select value={editing.type ?? 'percent'} onChange={e => setEditing(prev => ({ ...prev, type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-[#E02020]">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₦)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Value</label>
              <input type="number" min={0} value={editing.value ?? 0} onChange={e => setEditing(prev => ({ ...prev, value: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Min Order (₦)</label>
              <input type="number" min={0} value={editing.minOrder ?? ''} onChange={e => setEditing(prev => ({ ...prev, minOrder: Number(e.target.value) || undefined }))}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Max Uses</label>
              <input type="number" min={0} value={editing.maxUses ?? ''} onChange={e => setEditing(prev => ({ ...prev, maxUses: Number(e.target.value) || undefined }))}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Expires At</label>
              <input type="date" value={editing.expiresAt ?? ''} onChange={e => setEditing(prev => ({ ...prev, expiresAt: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !editing.code}
              className="flex-1 bg-[#E02020] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-gray-900">{coupon.code}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {coupon.type === 'percent' ? `${coupon.value}% off` : `₦${coupon.value} off`}
                </span>
                {coupon.minOrder && <span className="text-xs text-gray-400">Min ₦{(coupon.minOrder ?? 0).toLocaleString()}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {coupon.usedCount ?? 0} uses{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                {coupon.expiresAt ? ` · Expires ${coupon.expiresAt}` : ''}
              </p>
            </div>
            <button onClick={() => handleToggle(coupon)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors flex-shrink-0 ${coupon.isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${coupon.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <button onClick={() => setEditing({ ...coupon })} className="text-xs text-[#E02020] font-semibold hover:underline flex-shrink-0">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Audit Log Panel (super admin only) ───────────────────────────────────────
const AuditLogPanel = () => {
  const [logs,    setLogs]    = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [filter,  setFilter]  = useState('');

  const load = () => {
    setLoading(true);
    adminApi.getAuditLog(filter ? `actor=${encodeURIComponent(filter)}` : undefined)
      .then(res => { setLogs(res.data ?? []); setTotal(res.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const ACTION_COLOR: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-600',
    ADD_IMAGE: 'bg-purple-100 text-purple-700',
    CREATE_ADMIN: 'bg-yellow-100 text-yellow-700',
    DELETE_ADMIN: 'bg-red-100 text-red-600',
    SUPPORT_REPLY: 'bg-teal-100 text-teal-700',
    LOGIN: 'bg-indigo-100 text-indigo-700',
    LOGOUT: 'bg-gray-100 text-gray-700',
    PAYMENT_FAILED: 'bg-red-100 text-red-700',
    PAYMENT_CONFIRMED: 'bg-green-100 text-green-700',
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} total operations</p>
        <input type="text" value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter by actor name or username…"
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020] w-52" />
      </div>
      <div className="space-y-2">
        {logs.length === 0 ? <p className="text-center text-gray-400 py-8">No audit logs yet.</p> : (
          logs.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 mt-0.5 ${ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                {log.action}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 break-words">{log.target}</p>
                <p className="text-xs text-gray-500 mt-0.5 break-words">{log.details}</p>
                <p className="text-xs text-gray-400 mt-1">
                  by <span className="font-semibold text-gray-600">{log.actorName ?? log.adminUsername ?? log.actorEmail ?? 'system'}</span>
                  {log.actorType && <span className="ml-1 capitalize">({log.actorType})</span>}
                  {log.ipAddress && <> · <span className="font-mono">{log.ipAddress}</span></>}
                  {' · '}{(log.createdAt ?? '').slice(0, 16).replace('T', ' ')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── Security Panel ────────────────────────────────────────────────────────────
const SecurityPanel = () => {
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [pwdLoading,  setPwdLoading]  = useState(false);
  const [pwdError,    setPwdError]    = useState('');
  const [pwdSaved,    setPwdSaved]    = useState(false);
  const [otpEnabled,  setOtpEnabled]  = useState(false);
  const [otpSaving,   setOtpSaving]   = useState(false);

  const inp = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020]";

  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdError('');
    if (newPwd !== confirmPwd) return setPwdError('Passwords do not match');
    if (newPwd.length < 6)    return setPwdError('Password must be at least 6 characters');
    setPwdLoading(true);
    try {
      await adminApi.changePassword(currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdSaved(true); setTimeout(() => setPwdSaved(false), 3000);
    } catch (err) { setPwdError((err as Error).message); }
    finally { setPwdLoading(false); }
  };

  const handleOtpToggle = async () => {
    setOtpSaving(true);
    try {
      const res = await adminApi.toggleOtp(!otpEnabled);
      setOtpEnabled(res.otp_enabled);
    } catch (err) { console.error(err); }
    finally { setOtpSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-montserrat font-bold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePwdChange} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Current Password</label>
            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">New Password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required className={inp} />
          </div>
          {pwdError && <p className="text-sm text-red-500">{pwdError}</p>}
          <button type="submit" disabled={pwdLoading}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${pwdSaved ? 'bg-green-500' : 'bg-[#E02020] hover:bg-red-700'} disabled:opacity-60`}>
            {pwdLoading ? 'Changing…' : pwdSaved ? '✓ Password Changed!' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-montserrat font-bold text-gray-900">Two-Factor OTP</h3>
            <p className="text-sm text-gray-500 mt-1">Send a one-time code to your email on every login</p>
          </div>
          <button onClick={handleOtpToggle} disabled={otpSaving}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors flex-shrink-0 ${otpEnabled ? 'bg-green-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${otpEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className={`text-xs mt-2 font-semibold ${otpEnabled ? 'text-green-600' : 'text-gray-400'}`}>
          {otpEnabled ? '✓ OTP enabled — requires admin email to be set' : 'OTP disabled'}
        </p>
      </div>
    </div>
  );
};

// ── Admin Users Panel (super admin only) ──────────────────────────────────────
const AdminUsersPanel = () => {
  const [admins,  setAdmins]  = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ username: '', password: '', email: '' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    customersApi.getAdmins()
      .then(res => setAdmins(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const res = await customersApi.createAdmin(form);
      const newAdmin: AdminUser = { id: res.id, username: form.username, email: form.email, is_super_admin: false, otp_enabled: false, created_at: new Date().toISOString() };
      setAdmins(prev => [...prev, newAdmin]);
      setForm({ username: '', password: '', email: '' });
      setSuccess('Admin created successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number, uname: string) => {
    if (!confirm(`Delete admin "${uname}"? This cannot be undone.`)) return;
    try {
      await customersApi.deleteAdmin(id);
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (err) { alert((err as Error).message); }
  };

  const inp = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020]";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-montserrat font-bold text-gray-900 mb-4">Admin Users</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map(admin => (
              <div key={admin.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-gray-700 text-sm">{admin.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{admin.username}</p>
                  <p className="text-xs text-gray-400">{admin.email || 'No email'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {admin.is_super_admin && (
                    <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Super Admin</span>
                  )}
                  {admin.otp_enabled && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OTP</span>
                  )}
                  {!admin.is_super_admin && (
                    <button onClick={() => handleDelete(admin.id, admin.username)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-montserrat font-bold text-gray-900 mb-4">Create Admin</h3>
        {success && <div className="mb-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">{success}</div>}
        {error   && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required className={inp} placeholder="manager1" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email (for OTP)</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inp} placeholder="manager@xpola.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} className={inp} placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-[#E02020] text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
            {saving ? 'Creating…' : 'Create Admin User'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Maintenance Panel ─────────────────────────────────────────────────────────
const MaintenancePanel = () => {
  const [enabled,       setEnabled]       = useState(false);
  const [message,       setMessage]       = useState("We're performing scheduled maintenance. We'll be back shortly!");
  const [estimatedBack, setEstimatedBack] = useState('');
  const [scheduledAt,   setScheduledAt]   = useState('');
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  useEffect(() => {
    maintenanceApi.getStatus().then(d => {
      setEnabled(d.enabled ?? d.maintenance ?? false);
      if (d.message) setMessage(d.message);
      const eb = d.estimatedBack;
      if (eb) setEstimatedBack(eb);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await maintenanceApi.setStatus(enabled, message, estimatedBack || undefined, scheduledAt || undefined);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-gray-900">Maintenance Mode</h1>
        <p className="text-gray-500 text-sm mt-1">When enabled, visitors see a maintenance page. Admins always have access.</p>
      </div>

      <div className={`rounded-2xl border-2 p-6 transition-colors ${enabled ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${enabled ? 'bg-orange-500' : 'bg-gray-100'}`}>
              <Icon path={ICONS.maintenance} className={`w-6 h-6 ${enabled ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="font-montserrat font-bold text-gray-900">Maintenance Mode</p>
              <p className="text-sm text-gray-500">{enabled ? 'ACTIVE — site hidden from visitors' : 'OFF — site visible to everyone'}</p>
            </div>
          </div>
          <button onClick={() => setEnabled(v => !v)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${enabled ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
        {enabled && (
          <div className="mt-4 flex items-start gap-3 bg-orange-100 border border-orange-200 rounded-xl px-4 py-3">
            <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-orange-700 text-sm font-semibold">Maintenance is ON. Save to apply changes to the live site.</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Visitor Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020] resize-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Estimated Return</label>
          <input type="text" value={estimatedBack} onChange={e => setEstimatedBack(e.target.value)} placeholder="e.g. Today at 6:00 PM WAT"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Schedule Auto-Enable (optional)</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all ${saved ? 'bg-green-500' : enabled ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#E02020] hover:bg-red-700'} disabled:opacity-60`}>
        {saving ? 'Saving…' : saved ? '✓ Saved!' : `${enabled ? 'Enable' : 'Disable'} Maintenance Mode`}
      </button>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { isAuthenticated, isSuperAdmin, username, logout } = useAdmin();
  const navigate = useNavigate();
  const [view,          setView]          = useState<AdminView>('overview');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingNotifications, setPendingNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      adminNotificationsApi.get().then(data => setPendingNotifications(data.data.total ?? 0)).catch(() => {});
      adminApi.getStats()
        .then((data: any) => {
          const s = data?.stats ?? data;
          setPendingOrders(s?.pendingOrders ?? 0);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) { navigate('/admin'); return null; }

  const handleLogout = () => { logout(); navigate('/admin'); };

  const VIEW_LABELS: Record<AdminView, string> = {
    overview:    'Overview',
    products:    'Products',
    orders:      'Orders',
    notifications: 'Notifications',
    restock:     'Restock alerts',
    customers:   'Customers',
    comms:       'Communications',
    settings:    'Settings',
    maintenance: 'Maintenance',
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar view={view} setView={setView} onLogout={handleLogout}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} pendingOrders={pendingOrders} pendingNotifications={pendingNotifications} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
            <Icon path="M4 6h16M4 12h16M4 18h16" className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#E02020] rounded flex items-center justify-center">
              <Icon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-4 h-4 text-white" />
            </div>
            <span className="font-montserrat font-bold text-gray-900 text-sm">Xpola Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingOrders > 0 && (
              <button onClick={() => setView('orders')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-50 relative">
                <Icon path={ICONS.orders} className="w-4 h-4 text-orange-500" />
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingOrders}</span>
              </button>
            )}
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{VIEW_LABELS[view]}</span>
          </div>
        </div>

         <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">

          {view === 'overview'    && <Overview setView={setView} />}
          {view === 'products'    && <AdminProducts />}
          {view === 'orders'      && <AdminOrders />}
          {view === 'notifications' && <AdminNotifications onRestock={() => setView('restock')} />}
          {view === 'restock'     && <AdminRestock />}
          {view === 'customers'   && <CustomersPanel />}
          {view === 'comms'       && <CommsPanel />}
          {view === 'settings'    && <SettingsPanel />}
          {view === 'maintenance' && <MaintenancePanel />}
        </main>

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex items-stretch"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {BOTTOM_TABS.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ${view === tab.id ? 'text-[#E02020]' : 'text-gray-400'}`}>
              {tab.id === 'orders' && pendingOrders > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-orange-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingOrders}</span>
              )}
              {tab.id === 'notifications' && pendingNotifications > 0 && (
                <span className="absolute top-1.5 right-1/4 bg-yellow-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{pendingNotifications > 9 ? '9+' : pendingNotifications}</span>
              )}
              <Icon path={tab.icon} className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {view === tab.id && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#E02020] rounded-full" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
