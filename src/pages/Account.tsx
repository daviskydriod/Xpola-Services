// FILE PATH: src/pages/Account.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, SavedAddress } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';
import { ordersApi, supportApi, Order, SupportTicket, normalizeOrderStatus, API_BASE } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = 'home' | 'orders' | 'wishlist' | 'loyalty' | 'profile' | 'notifications' | 'referral' | 'support';

// ── Icon helper ───────────────────────────────────────────────────────────────
const Ico = ({ d, cls = 'w-5 h-5' }: { d: string | string[]; cls?: string }) => (
  <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {(Array.isArray(d) ? d : [d]).map((p, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={p} />
    ))}
  </svg>
);

const STATUS_COLOR: Record<string, string> = {
  paid:       'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-blue-50 text-blue-700 border-blue-100',   // payment captured = PAID
  shipped:    'bg-purple-50 text-purple-700 border-purple-100',
  delivered:  'bg-green-50 text-green-700 border-green-100',
  cancelled:  'bg-red-50 text-red-600 border-red-100',
  failed:     'bg-red-50 text-red-600 border-red-100',
};

const STATUS_LABEL: Record<string, string> = {
  paid:       'Paid',
  processing: 'Paid',          // show Paid since payment was captured
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
  failed:     'Failed',
  pending:    'Failed',        // pending = payment never completed = Failed
};

const TIER_COLOR: Record<string, string> = {
  bronze: 'text-orange-700 bg-orange-50 border-orange-200',
  silver: 'text-gray-600 bg-gray-100 border-gray-200',
  gold:   'text-yellow-700 bg-yellow-50 border-yellow-200',
};

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex justify-center py-16">
    <svg className="w-6 h-6 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  </div>
);

// ── Receipt printer ───────────────────────────────────────────────────────────
function printReceipt(order: Order) {
  const LOGO = 'https://xpolaservices.com/assets/logo-black-BzW0SzNp.png';
  const sym  = order.currency === 'NGN' ? '₦' : 'CA$';

  const items = (order.items ?? []).map(it =>
    `<tr>
      <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${it.name}</td>
      <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #f0f0f0;">${it.quantity}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:bold;border-bottom:1px solid #f0f0f0;">
        ${sym}${(Number(it.price) * it.quantity).toLocaleString()}
      </td>
    </tr>`
  ).join('');

  // Map status — processing means payment was captured = PAID
  const displayStatus = (() => {
    switch (order.status) {
      case 'processing': return { label: 'PAID',      color: '#1e40af', border: '#3b82f6' };
      case 'paid':       return { label: 'PAID',      color: '#1e40af', border: '#3b82f6' };
      case 'shipped':    return { label: 'SHIPPED',   color: '#5b21b6', border: '#8b5cf6' };
      case 'delivered':  return { label: 'DELIVERED', color: '#065f46', border: '#10b981' };
      case 'cancelled':  return { label: 'CANCELLED', color: '#991b1b', border: '#ef4444' };
      case 'failed':     return { label: 'FAILED',    color: '#7f1d1d', border: '#dc2626' };
      default:           return { label: 'FAILED',    color: '#7f1d1d', border: '#dc2626' };
    }
  })();

  const stampHtml = `
    <div style="position:absolute;top:32px;right:32px;border:4px solid ${displayStatus.border};
      color:${displayStatus.color};padding:8px 18px;font-size:22px;font-weight:900;
      font-family:Arial,sans-serif;letter-spacing:3px;transform:rotate(-12deg);
      opacity:0.75;border-radius:4px;text-transform:uppercase;">${displayStatus.label}</div>`;

  const discountRow = ((order as any).discount_amount ?? 0) > 0
    ? `<tr>
         <td>Discount (${(order as any).discount_code})</td>
         <td style="text-align:right;color:green;">
           -${sym}${Number((order as any).discount_amount).toLocaleString()}
         </td>
       </tr>` : '';

  const w = window.open('', '_blank', 'width=800,height=700');
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${order.order_ref}</title>
  <style>
    body  { font-family:Arial,sans-serif;padding:32px;color:#222;position:relative; }
    table { width:100%;border-collapse:collapse; }
    th    { background:#1a1a2e;color:#fff;padding:8px;text-align:left; }
    td    { padding:6px 8px; }
    .total{ font-size:18px;font-weight:800;color:#E02020; }
    .divider{ border:none;border-top:2px solid #E02020;margin:16px 0; }
    @media print{ body{padding:24px;} button{display:none;} }
  </style>
</head>
<body style="position:relative;">
  ${stampHtml}

  <div style="text-align:center;margin-bottom:20px;">
    <img src="${LOGO}" alt="Xpola Services" style="height:52px;object-fit:contain;" />
  </div>
  <p style="text-align:center;color:#666;font-size:13px;margin:-8px 0 24px;">xpolaservices.com</p>

  <h2 style="margin:0 0 8px;">INVOICE</h2>
  <hr class="divider"/>

  <table style="margin-bottom:16px;">
    <tr><td style="padding:3px 0;color:#666;width:140px;">Order Ref</td>
        <td style="font-weight:800;color:#E02020;font-family:monospace;font-size:16px;">${order.order_ref}</td></tr>
    <tr><td style="padding:3px 0;color:#666;">Date</td>
        <td>${order.created_at?.slice(0, 10)}</td></tr>
    <tr><td style="padding:3px 0;color:#666;">Customer</td>
        <td>${order.customer_name || 'Customer'}</td></tr>
    <tr><td style="padding:3px 0;color:#666;">Delivery</td>
        <td>${order.delivery_address ? order.delivery_address + ', ' : ''}${order.delivery_area || order.delivery_city || ''}, ${order.delivery_state || ''}</td></tr>
    <tr><td style="padding:3px 0;color:#666;">Status</td>
        <td style="font-weight:800;color:${displayStatus.border};text-transform:uppercase;">${displayStatus.label}</td></tr>
  </table>

  <table>
    <thead><tr>
      <th>Item</th>
      <th style="text-align:center;">Qty</th>
      <th style="text-align:right;">Amount</th>
    </tr></thead>
    <tbody>${items}</tbody>
  </table>

  <br/>
  <table>
    <tr><td>Subtotal</td><td style="text-align:right;">${sym}${Number(order.subtotal||0).toLocaleString()}</td></tr>
    <tr><td>Delivery</td><td style="text-align:right;">${sym}${Number(order.delivery_fee||0).toLocaleString()}</td></tr>
    ${discountRow}
    <tr class="total"><td>TOTAL</td><td style="text-align:right;">${sym}${Number(order.total||(order as any).total_amount||0).toLocaleString()}</td></tr>
  </table>

  <br/>
  <p style="color:#999;font-size:12px;">Payment via ${(order as any).payment_gateway||'Online Payment'} · Ref: ${(order as any).payment_ref||'N/A'}</p>
  <p style="color:#999;font-size:12px;">Thank you for shopping with Xpola Services!</p>

  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  w.document.close();
}

// ── Pager ─────────────────────────────────────────────────────────────────────
const Pager = ({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) => {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30">
        <Ico d="M15 19l-7-7 7-7" cls="w-4 h-4" />
      </button>
      <span className="text-xs font-semibold text-gray-500">{page} / {pages}</span>
      <button onClick={() => onChange(Math.min(pages, page + 1))} disabled={page === pages}
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30">
        <Ico d="M9 5l7 7-7 7" cls="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Home Tab ──────────────────────────────────────────────────────────────────
const HomeTab = ({ setTab }: { setTab: (t: Tab) => void }) => {
  const { user, loyaltyPoints, loyaltyTier, notifications, wishlist, unreadCount } = useAuth();
  const { currentData } = useCountry();
  const isNigeria = currentData.code === 'NG';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getUserOrders()
      .then(data => setOrders(data.map(order => ({ ...order, status: normalizeOrderStatus(order) }))))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const CARDS = [
    { label: 'Active Orders', value: String(orders.filter(o => ['paid','processing','shipped'].includes(o.status)).length), icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', tab: 'orders' as Tab, color: 'bg-blue-50 text-blue-600' },
    { label: 'Loyalty Points', value: loyaltyPoints.toLocaleString(), icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', tab: 'loyalty' as Tab, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Wishlist', value: String(wishlist.length), icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', tab: 'wishlist' as Tab, color: 'bg-red-50 text-red-500' },
    { label: 'Notifications', value: String(unreadCount), icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', tab: 'notifications' as Tab, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-5 text-white">
        <p className="text-gray-400 text-sm">Welcome back,</p>
        <p className="font-montserrat font-bold text-2xl mt-0.5">{user?.firstName} {user?.lastName}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${TIER_COLOR[loyaltyTier] ?? TIER_COLOR.bronze}`}>{loyaltyTier} Member</span>
          {!(user as any)?.emailVerified && (
            <span className="text-xs font-bold text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-full">⚠ Unverified</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map(c => (
          <button key={c.label} onClick={() => setTab(c.tab)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:border-[#E02020] transition-colors">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.color}`}>
              <Ico d={c.icon} cls="w-4 h-4" />
            </div>
            <p className="font-montserrat font-bold text-xl text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400">{c.label}</p>
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-montserrat font-bold text-sm text-gray-900">Recent Orders</p>
            <button onClick={() => setTab('orders')} className="text-xs text-[#E02020] font-bold hover:underline">View all →</button>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 3).map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-bold text-gray-900 font-mono">{o.order_ref}</p>
                  <p className="text-[10px] text-gray-400">{o.created_at?.slice(0, 10)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[o.status] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => setTab('referral')}
        className="w-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-4 text-white text-left hover:from-green-500 hover:to-emerald-600 transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">Refer & Earn 🎁</p>
            <p className="text-xs text-green-100 mt-0.5">Earn 500 pts per friend you refer</p>
          </div>
          <Ico d="M9 5l7 7-7 7" cls="w-4 h-4" />
        </div>
      </button>

      <Link to={isNigeria ? '/nigeria/shop' : '/canada/shop'}
        className="flex items-center justify-center gap-2 w-full bg-[#E02020] text-white font-bold py-3.5 rounded-2xl text-sm hover:bg-red-700 transition-colors">
        <Ico d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" cls="w-4 h-4" />
        Continue Shopping
      </Link>
    </div>
  );
};

// ── Orders Tab ────────────────────────────────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter]   = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [page, setPage]       = useState(1);
  const ORDERS_PER_PAGE = 8;
  const { currentData } = useCountry();
  const isNigeria = currentData.code === 'NG';

  useEffect(() => {
    ordersApi.getUserOrders()
      .then(data => setOrders(data.map(order => ({ ...order, status: normalizeOrderStatus(order) }))))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleReorder = (_order: Order) => {
    window.location.href = isNigeria ? '/nigeria/shop' : '/canada/shop';
  };

  const allFiltered = orders.filter(o => {
    if (filter === 'all')       return true;
    if (filter === 'active')    return ['paid','processing','shipped'].includes(o.status);
    if (filter === 'delivered') return o.status === 'delivered';
    if (filter === 'cancelled') return o.status === 'cancelled';
    return true;
  });
  const filtered = allFiltered.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

  const FILTERS = [
    { id: 'all', label: 'All' }, { id: 'active', label: 'Active' },
    { id: 'delivered', label: 'Delivered' }, { id: 'cancelled', label: 'Cancelled' },
  ] as const;

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Active',      value: orders.filter(o => ['paid','processing','shipped'].includes(o.status)).length, color: 'text-blue-600' },
          { label: 'Delivered',   value: orders.filter(o => o.status === 'delivered').length,  color: 'text-green-600' },
          { label: 'Total Orders', value: orders.length, color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className={`font-montserrat font-bold text-xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setPage(1); }}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === f.id ? 'bg-[#E02020] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Ico d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" cls="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold text-sm">No orders here yet</p>
          <Link to={isNigeria ? '/nigeria/shop' : '/canada/shop'} className="inline-block mt-4 bg-[#E02020] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-montserrat font-bold text-sm text-gray-900">{order.order_ref || ('#' + String(order.id).slice(-8).toUpperCase())}</p>
                    <p className="text-xs text-gray-400">
                      {order.created_at?.slice(0, 10)} · {(order.items ?? []).length} item{(order.items ?? []).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[order.status] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-montserrat font-bold text-sm text-gray-900">{order.currency === 'NGN' ? '₦' : 'CA$'}{order.total?.toLocaleString()}</p>
                  <Ico d="M19 9l-7 7-7-7" cls={`w-4 h-4 text-gray-400 transition-transform ${expanded === order.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t border-gray-50 bg-gray-50/50 p-4 space-y-4">
                  <div className="bg-gray-900 rounded-xl p-4 mb-2">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Order Reference</p>
                    <p className="font-montserrat font-bold text-xl text-white font-mono tracking-wider mt-0.5">{order.order_ref}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-400">
                      <div><span className="text-gray-500">Delivery:</span> <span className="text-white">{order.delivery_area || order.delivery_city}</span></div>
                      <div><span className="text-gray-500">Gateway:</span> <span className="text-white capitalize">{(order as any).payment_gateway || 'N/A'}</span></div>
                      <div><span className="text-gray-500">Subtotal:</span> <span className="text-white">{order.currency === 'NGN' ? '₦' : 'CA$'}{Number(order.subtotal || 0).toLocaleString()}</span></div>
                      <div><span className="text-gray-500">Delivery fee:</span> <span className="text-white">{order.currency === 'NGN' ? '₦' : 'CA$'}{Number(order.delivery_fee || 0).toLocaleString()}</span></div>
                      {((order as any).discount_amount ?? 0) > 0 && <div className="col-span-2"><span className="text-gray-500">Discount:</span> <span className="text-green-400">-{order.currency === 'NGN' ? '₦' : 'CA$'}{Number((order as any).discount_amount || 0).toLocaleString()}</span></div>}
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                      <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" cls="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs font-bold text-purple-700">Tracking Number</p>
                        <p className="font-mono text-sm font-bold text-purple-900">{order.trackingNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100">
                    {(order.items ?? []).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                          {item.currency === 'NGN' ? '₦' : 'CA$'}{(Number(item.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Actions — NO cancel button */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'delivered' && (
                      <button onClick={() => handleReorder(order)}
                        className="flex items-center gap-1.5 bg-[#E02020] text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-red-700 transition-colors">
                        <Ico d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" cls="w-3.5 h-3.5" />
                        Re-order
                      </button>
                    )}
                    <button
                      onClick={() => printReceipt(order)}
                      className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-xs hover:bg-gray-50 transition-colors">
                      <Ico d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" cls="w-3.5 h-3.5" />
                      Print Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pager page={page} total={allFiltered.length} perPage={ORDERS_PER_PAGE} onChange={setPage} />
    </div>
  );
};

// ── Wishlist Tab ──────────────────────────────────────────────────────────────
const WishlistTab = () => {
  const { wishlist, wishlistLoading, removeFromWishlist, toggleWishlistRestock } = useAuth();
  const { currentData } = useCountry();
  const isNigeria = currentData.code === 'NG';

  if (wishlistLoading) return <Spinner />;

  if (wishlist.length === 0) return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <Ico d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" cls="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-400 font-semibold text-sm">Your wishlist is empty</p>
      <Link to={isNigeria ? '/nigeria/shop' : '/canada/shop'} className="inline-block mt-4 bg-[#E02020] text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">Browse Products</Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {wishlist.map(item => {
        const p  = item.product;
        const sym = p?.currency === 'CAD' ? 'CA$' : '₦';
        const imgSrc = p?.image_path
          ? (p.image_path.startsWith('http') ? p.image_path : `https://xpolaservices.com${p.image_path}`)
          : null;
        return (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {imgSrc ? (
                <img src={imgSrc} alt={p?.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  <Ico d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" cls="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{p?.name ?? 'Product'}</p>
                <p className="font-montserrat font-bold text-[#E02020] text-sm mt-0.5">{sym}{Number(p?.price ?? 0).toLocaleString()}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${p?.stock_status === 'in_stock' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {p?.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <button onClick={() => removeFromWishlist(item.id)}
                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 hover:bg-red-100 transition-colors">
                <Ico d="M6 18L18 6M6 6l12 12" cls="w-4 h-4 text-red-500" />
              </button>
            </div>
            {p?.stock_status === 'out_of_stock' && (
              <button
                onClick={() => toggleWishlistRestock(item.id, !item.notifyOnRestock)}
                className={`mt-3 w-full py-2 rounded-xl text-xs font-bold border transition-colors ${item.notifyOnRestock ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-[#E02020] hover:text-[#E02020]'}`}>
                {item.notifyOnRestock ? '✓ Notifying you on restock' : 'Notify me when back in stock'}
              </button>
            )}
            {p?.stock_status === 'in_stock' && (
              <Link to={`/product/${p.id}`}
                className="mt-3 block w-full py-2 rounded-xl text-xs font-bold bg-[#E02020] text-white text-center hover:bg-red-700 transition-colors">
                View Product
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Loyalty Tab ───────────────────────────────────────────────────────────────
const LoyaltyTab = () => {
  const { loyaltyPoints, loyaltyTier, loyaltyHistory } = useAuth();

  const TIERS = [
    { id: 'bronze', label: 'Bronze', min: 0,    max: 999,      perks: ['Earn 1 pt per ₦100 spent', 'Birthday bonus'] },
    { id: 'silver', label: 'Silver', min: 1000, max: 4999,     perks: ['All Bronze perks', 'Free delivery on orders ₦30k+', 'Early product access'] },
    { id: 'gold',   label: 'Gold',   min: 5000, max: Infinity, perks: ['All Silver perks', 'Free delivery always', 'Dedicated support', 'Exclusive discounts'] },
  ];

  const currentTierIndex = TIERS.findIndex(t => t.id === loyaltyTier);
  const nextTier = currentTierIndex >= 0 ? TIERS[currentTierIndex + 1] : undefined;
  const progress = nextTier ? Math.min((loyaltyPoints / nextTier.min) * 100, 100) : 100;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-5 text-white">
        <p className="text-yellow-100 text-sm font-semibold">Your Points Balance</p>
        <p className="font-montserrat font-extrabold text-4xl mt-1">{loyaltyPoints.toLocaleString()}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xs font-bold bg-white/20 px-3 py-1 rounded-full capitalize`}>{loyaltyTier} Member</span>
        </div>
      </div>

      {nextTier && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">Progress to {nextTier.label}</p>
            <p className="text-xs text-gray-400">{loyaltyPoints} / {nextTier.min} pts</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{Math.max(0, nextTier.min - loyaltyPoints)} more points to {nextTier.label}</p>
        </div>
      )}

      <div className="space-y-3">
        {TIERS.map(tier => (
          <div key={tier.id} className={`rounded-2xl border-2 p-4 transition-colors ${tier.id === loyaltyTier ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TIER_COLOR[tier.id] ?? ''}`}>{tier.label}</span>
              <span className="text-xs text-gray-400">{tier.min.toLocaleString()}+ pts</span>
              {tier.id === loyaltyTier && <span className="text-xs font-bold text-yellow-600 ml-auto">Current</span>}
            </div>
            <ul className="space-y-1">
              {tier.perks.map(perk => (
                <li key={perk} className="flex items-center gap-2 text-xs text-gray-600">
                  <Ico d="M5 13l4 4L19 7" cls="w-3 h-3 text-green-500 flex-shrink-0" />{perk}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {loyaltyHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-montserrat font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Points History</h3>
          <div className="space-y-2">
            {loyaltyHistory.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">{tx.createdAt?.slice(0, 10)}</p>
                </div>
                <span className={`font-montserrat font-bold text-sm ${tx.type === 'earned' || tx.type === 'bonus' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'redeemed' ? '-' : '+'}{tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Referral Tab ──────────────────────────────────────────────────────────────
const ReferralTab = () => {
  const { referralCode, referralStats, user } = useAuth();
  const [copied, setCopied] = useState(false);

  // FIX: link goes to /login?mode=register (the register page), not the homepage
  const referralUrl = referralCode
    ? `${window.location.origin}/login?mode=register&ref=${referralCode}`
    : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Shop at Xpola Services and get 5% off your first order! Use my referral link: ${referralUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Referred-by banner */}
      {(user as any)?.referredBy && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Ico d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" cls="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-800">You were referred!</p>
            <p className="text-xs text-blue-600">You joined via referral code <strong>{(user as any).referredBy}</strong></p>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl p-5 text-white">
        <p className="text-green-100 text-sm font-semibold">Your Referral Code</p>
        <p className="font-montserrat font-extrabold text-3xl mt-1 font-mono tracking-widest">{referralCode || '—'}</p>
        <p className="text-green-100 text-xs mt-2">Share and earn 500 points per successful referral</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Friends Referred', value: referralStats.referred },
          { label: 'Completed',        value: referralStats.completed },
          { label: 'Points Earned',    value: referralStats.bonusEarned },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="font-montserrat font-bold text-xl text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Referral Link</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <p className="text-xs text-gray-600 flex-1 truncate font-mono">{referralUrl || 'Loading…'}</p>
          <button onClick={handleCopy} disabled={!referralUrl}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-[#E02020] text-white hover:bg-red-700'}`}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={handleWhatsApp} disabled={!referralUrl}
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl text-sm hover:bg-green-600 transition-colors disabled:opacity-50">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share via WhatsApp
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-blue-800 mb-1">How it works</p>
        <ol className="space-y-1">
          {['Share your unique link with friends', 'Friend clicks link and registers an account', 'Friend places their first order', 'You earn 500 loyalty points!'].map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
              <span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[10px]">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

// ── Notifications Tab ─────────────────────────────────────────────────────────
const NotificationsTab = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useAuth();

  const TYPE_ICONS: Record<string, string> = {
    order:    'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    points:   'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    referral: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
    promo:    'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    wishlist: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    default:  'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  };

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-600">{unreadCount} unread</p>
          <button onClick={markAllNotificationsRead} className="text-xs text-[#E02020] font-bold hover:underline">Mark all read</button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Ico d={TYPE_ICONS.default} cls="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.read && markNotificationRead(n.id)}
              className={`bg-white rounded-2xl border p-4 cursor-pointer hover:border-[#E02020] transition-colors ${n.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                  <Ico d={TYPE_ICONS[n.type] ?? TYPE_ICONS.default} cls={`w-4 h-4 ${n.read ? 'text-gray-500' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.createdAt?.slice(0, 16).replace('T', ' ')}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Support Tab ───────────────────────────────────────────────────────────────
const SupportTab = () => {
  const [tickets, setTickets]     = useState<SupportTicket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]   = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying]   = useState(false);
  const [form, setForm]           = useState({ subject: '', category: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const load = () => {
    setLoading(true);
    supportApi.getAll().then(setTickets).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { id, reference } = await supportApi.create(form);
      const newTicket: SupportTicket = {
        id, reference,
        subject: form.subject, category: form.category, message: form.message,
        status: 'open', createdAt: new Date().toISOString(),
        messages: [{ id: '0', sender: 'user', body: form.message, createdAt: new Date().toISOString() }],
        replies: [],
      };
      setTickets(prev => [newTicket, ...prev]);
      setForm({ subject: '', category: '', message: '' });
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } finally { setSubmitting(false); }
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      await supportApi.reply(selected.id, replyText.trim());
      const msg = { id: Date.now().toString(), sender: 'user' as const, body: replyText.trim(), createdAt: new Date().toISOString() };
      setSelected(prev => prev ? { ...prev, messages: [...(prev.messages ?? []), msg], status: 'open' } : prev);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, messages: [...(t.messages ?? []), msg], status: 'open' } : t));
      setReplyText('');
    } catch (e) { console.error(e); }
    finally { setReplying(false); }
  };

  const statusColors: Record<string, string> = {
    open:        'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved:    'bg-green-100 text-green-700',
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {submitted && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 flex items-center gap-2">
          <Ico d="M5 13l4 4L19 7" cls="w-4 h-4" /> Ticket submitted! We'll respond within 24 hours.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#E02020] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">
            <Ico d="M12 4v16m8-8H4" cls="w-4 h-4" /> New Ticket
          </button>
        )}
      </div>

      <a href={`https://wa.me/2347086275105?text=${encodeURIComponent('Hi Xpola, I need support with my account.')}`}
        target="_blank" rel="noreferrer"
        className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 hover:bg-green-100 transition-colors">
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-green-500 flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <div>
          <p className="font-bold text-sm text-green-800">Chat on WhatsApp</p>
          <p className="text-xs text-green-600">Fastest support for Nigerian customers</p>
        </div>
        <Ico d="M9 5l7 7-7 7" cls="w-4 h-4 text-green-600 ml-auto" />
      </a>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-montserrat font-bold text-gray-900">New Support Ticket</h3>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020] bg-white">
              <option value="">Select a category…</option>
              <option value="Order Issue">Order Issue</option>
              <option value="Payment Problem">Payment Problem</option>
              <option value="Delivery Question">Delivery Question</option>
              <option value="Product Question">Product Question</option>
              <option value="Account Problem">Account Problem</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Subject</label>
            <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required
              placeholder="Brief description" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Message</label>
            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required rows={4}
              placeholder="Describe your issue in detail…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020] resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="flex-1 bg-[#E02020] text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Cancel</button>
          </div>
        </form>
      )}

      {tickets.map(t => (
        <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:border-[#E02020] transition-colors"
          onClick={() => { setSelected(t); setReplyText(''); }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-900">{t.subject}</p>
              <p className="text-xs text-gray-400">{t.reference} · {t.category} · {(t.createdAt || t.created_at)?.slice(0, 10)}</p>
              {/* Show message count */}
              {(t.messages?.length ?? 0) > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{t.messages.length} message{t.messages.length !== 1 ? 's' : ''}</p>
              )}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {t.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      ))}

      {/* Ticket detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-montserrat font-bold text-gray-900 text-sm">{selected.subject}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selected.reference} · {selected.category}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100">
                <Ico d="M6 18L18 6M6 6l12 12" cls="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Chat thread — scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
              {(selected.messages ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
              ) : (selected.messages ?? []).map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender === 'user' ? 'bg-[#E02020] text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${msg.sender === 'user' ? 'text-red-200' : 'text-gray-500'}`}>
                      {msg.sender === 'user' ? 'You' : 'Xpola Support'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-red-200' : 'text-gray-400'}`}>
                      {(msg.createdAt || msg.created_at)?.slice(0, 16).replace('T', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {selected.status !== 'resolved' ? (
              <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-3">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                  placeholder="Type your reply…"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020] resize-none" />
                <button onClick={handleReply} disabled={replying || !replyText.trim()}
                  className="w-full bg-[#E02020] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-50">
                  {replying ? 'Sending…' : 'Send Reply'}
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm text-green-700 font-semibold">✓ This ticket has been resolved</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Profile Tab ───────────────────────────────────────────────────────────────
const ProfileTab = ({ onLogout }: { onLogout: () => void }) => {
  const { user, updateUserProfile, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress, refreshUser } = useAuth();
  const { currentData } = useCountry();
  const isNigeria = currentData.code === 'NG';
  const [subtab, setSubtab] = useState<'info' | 'password' | 'addresses' | 'danger'>('info');

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '');
  const [phone,     setPhone]     = useState(user?.phone     ?? '');
  const [saving, setSaving]       = useState(false);
  const [saved,  setSaved]        = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving]   = useState(false);
  const [pwdError,  setPwdError]    = useState('');
  const [pwdSaved,  setPwdSaved]    = useState(false);

  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editAddrId,   setEditAddrId]   = useState<string | null>(null);
  const [addrForm, setAddrForm]         = useState({ label: '', street: '', city: '', state: '', country: '', isDefault: false });
  const [addrSaving, setAddrSaving]     = useState(false);

  useEffect(() => { refreshUser(); }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      await updateUserProfile({ firstName, lastName, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdError('');
    if (newPwd !== confirmPwd) return setPwdError('Passwords do not match.');
    if (newPwd.length < 6)    return setPwdError('Password must be at least 6 characters.');
    setPwdSaving(true);
    try {
      await changePassword(currentPwd, newPwd);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err) { setPwdError((err as Error).message); }
    finally { setPwdSaving(false); }
  };

  const handleAddrSave = async (e: React.FormEvent) => {
    e.preventDefault(); setAddrSaving(true);
    try {
      if (editAddrId) { await updateAddress(editAddrId, addrForm); }
      else            { await addAddress(addrForm); }
      setShowAddrForm(false); setEditAddrId(null);
      setAddrForm({ label: '', street: '', city: '', state: '', country: '', isDefault: false });
    } finally { setAddrSaving(false); }
  };

  const handleResendVerification = async () => {
    setResendingVerify(true);
    try {
      const token = localStorage.getItem('xpola_token');
      const res = await fetch(`${API_BASE}/auth.php?action=resend_verification`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast({ title: 'Email sent!', description: 'Check your inbox for the verification link.' }); }
      else        { toast({ title: 'Failed', description: 'Could not resend. Try again later.' }); }
    } catch { toast({ title: 'Error', description: 'Network error. Please try again.' }); }
    finally { setResendingVerify(false); }
  };

  const SUBTABS = [
    { id: 'info', label: 'Info' }, { id: 'password', label: 'Password' },
    { id: 'addresses', label: 'Addresses' }, { id: 'danger', label: 'Account' },
  ] as const;

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020] transition-colors';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#E02020] flex items-center justify-center flex-shrink-0">
          <span className="font-montserrat font-bold text-2xl text-white">
            {user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <div>
          <p className="font-montserrat font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
          {(user as any)?.emailVerified ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mt-1">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1">⚠ Email not verified</span>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto bg-gray-100 rounded-xl p-1 gap-1 no-scrollbar">
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSubtab(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${subtab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {subtab === 'info' && (
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inp} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
            <input type="email" value={user?.email ?? ''} disabled className={inp + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
          </div>
          {(user as any)?.emailVerified ? (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Ico d="M5 13l4 4L19 7" cls="w-4 h-4 text-green-600" />
              <p className="text-sm font-bold text-green-800">Email verified ✓</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
              <p className="text-sm font-bold text-amber-800 mb-1">Email not verified</p>
              <p className="text-xs text-amber-700 mb-2">Check <strong>{user?.email}</strong> for the verification link.</p>
              <button type="button" onClick={handleResendVerification} disabled={resendingVerify}
                className="text-xs font-bold text-amber-800 underline hover:text-amber-900 disabled:opacity-50">
                {resendingVerify ? 'Sending…' : 'Resend verification email →'}
              </button>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className={inp} />
          </div>
          <button type="submit" disabled={saving}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${saved ? 'bg-green-500' : 'bg-[#E02020] hover:bg-red-700'} disabled:opacity-60`}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </form>
      )}

      {subtab === 'password' && (
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Current Password</label>
            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">New Password</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required className={inp} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required className={inp} />
          </div>
          {pwdError && <p className="text-sm text-red-500">{pwdError}</p>}
          <button type="submit" disabled={pwdSaving}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${pwdSaved ? 'bg-green-500' : 'bg-[#E02020] hover:bg-red-700'} disabled:opacity-60`}>
            {pwdSaving ? 'Changing…' : pwdSaved ? '✓ Changed!' : 'Change Password'}
          </button>
        </form>
      )}

      {subtab === 'addresses' && (
        <div className="space-y-3">
          {(user?.addresses ?? []).map((addr: SavedAddress) => (
            <div key={addr.id} className={`border-2 rounded-2xl p-4 ${addr.isDefault ? 'border-[#E02020] bg-red-50/30' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{addr.label}</p>
                    {addr.isDefault && <span className="text-[10px] font-bold bg-[#E02020] text-white px-2 py-0.5 rounded-full">Default</span>}
                  </div>
                  <p className="text-xs text-gray-500">{addr.street}, {addr.city}, {addr.state}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className="text-xs text-[#E02020] font-semibold">Set default</button>}
                  <button onClick={() => { setAddrForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, country: addr.country, isDefault: addr.isDefault }); setEditAddrId(addr.id); setShowAddrForm(true); }} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
                  <button onClick={() => deleteAddress(addr.id)} className="text-xs text-gray-400 hover:text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {!showAddrForm ? (
            <button onClick={() => { setShowAddrForm(true); setEditAddrId(null); setAddrForm({ label: '', street: '', city: '', state: '', country: '', isDefault: false }); }}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-2 text-gray-400 hover:border-[#E02020] hover:text-[#E02020] transition-colors text-sm font-semibold">
              <Ico d="M12 4v16m8-8H4" cls="w-4 h-4" /> Add New Address
            </button>
          ) : (
            <form onSubmit={handleAddrSave} className="border-2 border-gray-200 rounded-2xl p-4 space-y-3 bg-gray-50">
              <p className="font-bold text-sm text-gray-900">{editAddrId ? 'Edit Address' : 'New Address'}</p>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Label</label>
                <input type="text" value={addrForm.label} onChange={e => setAddrForm(p => ({ ...p, label: e.target.value }))} placeholder="Home, Office…" required className={inp} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Street Address</label>
                <input type="text" value={addrForm.street} onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))} required className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">City</label>
                  <input type="text" value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} required className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{isNigeria ? 'State' : 'Province'}</label>
                  <input type="text" value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} required className={inp} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm(p => ({ ...p, isDefault: e.target.checked }))} className="accent-[#E02020]" />
                Set as default address
              </label>
              <div className="flex gap-3">
                <button type="submit" disabled={addrSaving} className="flex-1 bg-[#E02020] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-red-700 disabled:opacity-60">
                  {addrSaving ? 'Saving…' : editAddrId ? 'Update' : 'Save'}
                </button>
                <button type="button" onClick={() => setShowAddrForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {subtab === 'danger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-montserrat font-bold text-gray-900 mb-1">Sign Out</h3>
            <p className="text-sm text-gray-500 mb-3">Sign out of your Xpola account on this device.</p>
            <button onClick={onLogout} className="w-full border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">Sign Out</button>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
            <h3 className="font-montserrat font-bold text-red-700 mb-1">Delete Account</h3>
            <p className="text-sm text-red-500 mb-3">Permanently delete your account. This cannot be undone.</p>
            <button className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-red-700 transition-colors">Request Account Deletion</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Account ──────────────────────────────────────────────────────────────
const Account = () => {
  const { user, logout, unreadCount, wishlist, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('home');

  useEffect(() => { refreshUser(); }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) { navigate('/login'); return null; }

  const BOTTOM_TABS = [
    { id: 'home'     as Tab, label: 'Home',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'orders'   as Tab, label: 'Orders',  icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'wishlist' as Tab, label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', badge: wishlist.length },
    { id: 'loyalty'  as Tab, label: 'Rewards', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { id: 'profile'  as Tab, label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const TAB_TITLES: Record<Tab, string> = {
    home: 'My Account', orders: 'My Orders', wishlist: 'Wishlist',
    loyalty: 'Rewards', profile: 'Profile', notifications: 'Notifications',
    referral: 'Refer & Earn', support: 'Support',
  };

  const SIDEBAR_ITEMS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'home',          label: 'Home',          icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'orders',        label: 'My Orders',     icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'wishlist',      label: 'Wishlist',      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', badge: wishlist.length },
    { id: 'loyalty',       label: 'Rewards',       icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { id: 'referral',      label: 'Refer & Earn',  icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', badge: unreadCount },
    { id: 'support',       label: 'Support',       icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'profile',       label: 'Profile',       icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Customer portal top bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E02020] flex items-center justify-center shadow-sm shadow-red-200">
              <Ico d="M13 10V3L4 14h7v7l9-11h-7z" cls="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-montserrat font-extrabold text-gray-900 leading-tight">Xpola</p>
              <p className="text-[11px] font-semibold text-gray-400 truncate">Customer Portal · {TAB_TITLES[tab]}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setTab('notifications')} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${tab === 'notifications' ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-blue-600'}`}>
              <Ico d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" cls="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              {user.avatar ? <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> : (
                <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.firstName?.[0]?.toUpperCase() ?? 'U'}</span>
                </div>
              )}
              <div className="hidden md:block max-w-[150px]">
                <p className="text-sm font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>

            <button onClick={handleLogout} aria-label="Sign out"
              className="h-10 px-3 sm:px-4 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-semibold">
              <Ico d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" cls="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-28 md:pb-12 lg:flex lg:gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E02020] flex items-center justify-center">
                    <span className="font-bold text-white">{user.firstName?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  {!(user as any).emailVerified && <span className="text-[9px] font-bold text-amber-600">⚠ Unverified email</span>}
                </div>
              </div>
            </div>
            <nav className="p-2 space-y-0.5">
              {SIDEBAR_ITEMS.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${tab === item.id ? 'bg-[#E02020] text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Ico d={item.icon} cls="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-auto bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'home'          && <HomeTab setTab={setTab} />}
          {tab === 'orders'        && <OrdersTab />}
          {tab === 'wishlist'      && <WishlistTab />}
          {tab === 'loyalty'       && <LoyaltyTab />}
          {tab === 'referral'      && <ReferralTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'support'       && <SupportTab />}
          {tab === 'profile'       && <ProfileTab onLogout={handleLogout} />}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {BOTTOM_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative ${tab === t.id ? 'text-[#E02020]' : 'text-gray-400'}`}>
            {t.id === 'notifications' && unreadCount > 0 && (
              <span className="absolute top-1.5 right-1/4 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
            {t.id === 'wishlist' && (t as any).badge > 0 && (
              <span className="absolute top-1.5 right-1/4 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{(t as any).badge}</span>
            )}
            <Ico d={t.icon} cls="w-5 h-5" />
            <span className="text-[10px] font-semibold">{t.label}</span>
            {tab === t.id && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#E02020] rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Account;
