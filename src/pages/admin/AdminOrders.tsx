// FILE PATH: src/pages/admin/AdminOrders.tsx

import { useState, useEffect } from 'react';
import { useAdmin, AdminOrder } from '@/contexts/AdminContext';
import { formatPrice } from '@/lib/api';

type Status = AdminOrder['status'];

const STATUS_STYLES: Record<Status, string> = {
  pending:    'bg-blue-100 text-blue-700 border-blue-200',
  paid:       'bg-blue-100 text-blue-700 border-blue-200',
  failed:     'bg-red-100 text-red-700 border-red-200',
  processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  shipped:    'bg-purple-100 text-purple-700 border-purple-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-600 border-red-200',
};

const STATUS_LABELS: Record<Status, string> = {
  pending:    'Awaiting Payment',
  paid:       'Paid',
  failed:     'Payment Failed',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const STATUS_ORDER: Status[] = ['pending', 'processing', 'shipped', 'delivered'];

const formatDate = (ts: string): string => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

interface OrderItem {
  name:      string;
  quantity:  number;
  price:     number;
  currency:  string;
  image?:    string;
  category?: string;
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
interface OrderModalProps {
  order:     AdminOrder;
  onClose:   () => void;
  onUpdate:  (id: number, status: Status) => Promise<void>;
  onDelete:  (id: number) => Promise<void>;
}

const OrderModal = ({ order, onClose, onUpdate, onDelete }: OrderModalProps) => {
  const [status,    setStatus]    = useState<Status>(order.status);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [confirmDel,setConfirmDel]= useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(order.id, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      await onDelete(order.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const items = (order.items ?? []) as OrderItem[];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-montserrat font-bold text-gray-900">#{order.order_ref}</h2>
            <p className="text-xs text-gray-400 font-poppins">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Status stepper */}
          <div className="flex justify-between mb-2">
            {STATUS_ORDER.map((s: Status, i: number) => {
              const idx     = STATUS_ORDER.indexOf(status);
              const done    = i <= idx;
              const current = s === status;
              return (
                <div key={s} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                    ${done ? 'bg-[#E02020] border-[#E02020]' : 'bg-white border-gray-300'}
                    ${current ? 'ring-4 ring-red-100' : ''}`}>
                    {done
                      ? <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      : <div className="w-2 h-2 rounded-full bg-gray-300"/>}
                  </div>
                  <span className={`text-[10px] font-semibold text-center ${done ? 'text-[#E02020]' : 'text-gray-400'}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Update status */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="font-montserrat font-bold text-xs text-gray-600 uppercase tracking-wider">Update Status</p>
            <div className="grid grid-cols-2 gap-2">
            {(['pending','paid','processing','shipped','delivered','cancelled','failed'] as Status[]).map((s: Status) => {
  const ORDER_RANK: Record<Status, number> = {
    pending: 0, paid: 1, processing: 2, shipped: 3, delivered: 4, cancelled: 5, failed: 0,
  };
  // Can't go back to a lower status once past pending
  // Exception: cancelled is always allowed
  const currentRank = ORDER_RANK[order.status];
  const isLocked = s !== 'cancelled' && ORDER_RANK[s] < currentRank;

  return (
    <button key={s} onClick={() => !isLocked && setStatus(s)}
      disabled={isLocked}
      title={isLocked ? 'Cannot revert to a previous status' : undefined}
      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all
        ${isLocked
          ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
          : status === s
            ? STATUS_STYLES[s] + ' ring-2 ring-offset-1 ring-current'
            : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
      {STATUS_LABELS[s]}
      {isLocked && ' 🔒'}
    </button>
  );
})}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-[#E02020] text-white font-semibold py-3 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
                : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>

          {/* Customer & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="font-montserrat font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Customer</p>
              <p className="font-semibold text-gray-900 text-sm">{order.customer_name}</p>
              <p className="text-sm text-gray-500 mt-1">{order.customer_email}</p>
              <p className="text-sm text-gray-500">{order.customer_phone}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="font-montserrat font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Delivery</p>
              <p className="text-sm text-gray-700">{order.delivery_area || '—'}</p>
              <p className="text-sm text-gray-700">{order.delivery_city}, {order.delivery_state}</p>
              <p className="text-xs text-gray-400 mt-1">{order.country === 'NG' ? '🇳🇬 Nigeria' : '🇨🇦 Canada'}</p>
            </div>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <p className="font-montserrat font-bold text-xs text-gray-500 uppercase tracking-wider mb-3">Items Ordered</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {items.map((item: OrderItem, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    {item.image && (
                      <img src={item.image} alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}/>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm text-gray-900 flex-shrink-0">
                      {formatPrice(item.price * item.quantity, item.currency)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 px-3">
                <span className="font-semibold text-gray-600 text-sm">Total</span>
                <span className="font-montserrat font-extrabold text-gray-900">
                  {formatPrice(order.total_amount, order.currency)}
                </span>
              </div>
            </div>
          )}

          {/* Delete order */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`w-full py-3 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2
                ${confirmDel
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
                  : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
              {deleting
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Deleting…</>
                : confirmDel
                  ? '⚠ Tap again to confirm delete'
                  : '🗑 Delete Order'}
            </button>
            {confirmDel && (
              <p className="text-xs text-center text-gray-400 mt-1">This is permanent and cannot be undone.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Pager ─────────────────────────────────────────────────────────────────────
const PER_PAGE = 6;

const Pager = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
  const lastPage = Math.ceil(total / PER_PAGE);
  if (lastPage <= 1) return null;
  const pages = Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
    return lastPage <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, lastPage - 4)) + i;
  });
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
      <p className="text-xs text-gray-400">
        {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)} of {total}
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

// ── Main AdminOrders ──────────────────────────────────────────────────────────
export default function AdminOrders() {
  const { orders, ordersLoading, fetchOrders, updateOrderStatus, deleteOrder } = useAdmin();

  const [selected,      setSelected]      = useState<AdminOrder | null>(null);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState<'all' | Status>('all');
  const [filterCountry, setFilterCountry] = useState<'all' | 'NG' | 'CA'>('all');
  const [page,          setPage]          = useState(1);
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');

  useEffect(() => { fetchOrders(); }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterCountry, dateFrom, dateTo]);

  const allFiltered = orders.filter((o: AdminOrder) => {
    const q = search.toLowerCase();
    const m = !search
      || o.order_ref.toLowerCase().includes(q)
      || o.customer_name.toLowerCase().includes(q)
      || o.customer_email.toLowerCase().includes(q);
    const s = filterStatus  === 'all' || o.status  === filterStatus;
    const c = filterCountry === 'all' || o.country === filterCountry;
    const created = o.created_at ? new Date(o.created_at).getTime() : NaN;
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Infinity;
    const d = Number.isNaN(created) || (created >= from && created <= to);
    return m && s && c && d;
  });

  const paginated = allFiltered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total:      orders.length,
    pending:    orders.filter((o: AdminOrder) => o.status === 'pending').length,
    processing: orders.filter((o: AdminOrder) => o.status === 'processing').length,
    shipped:    orders.filter((o: AdminOrder) => o.status === 'shipped').length,
    delivered:  orders.filter((o: AdminOrder) => o.status === 'delivered').length,
    failed:     orders.filter((o: AdminOrder) => o.status === 'failed').length,
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total orders</p>
        </div>
        <button onClick={() => fetchOrders()}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {([
          { k: 'total',      l: 'Total',      c: 'bg-gray-100 text-gray-700'     },
          { k: 'pending',    l: 'Placed',      c: 'bg-blue-100 text-blue-700'     },
          { k: 'processing', l: 'Processing',  c: 'bg-yellow-100 text-yellow-700' },
          { k: 'shipped',    l: 'Shipped',     c: 'bg-purple-100 text-purple-700' },
          { k: 'delivered',  l: 'Delivered',   c: 'bg-green-100 text-green-700'   },
          { k: 'failed',     l: 'Failed',      c: 'bg-red-100 text-red-700'        },
        ] as { k: keyof typeof stats; l: string; c: string }[]).map(s => (
          <div key={s.k} className={`${s.c} rounded-xl p-3 text-center`}>
            <p className="font-montserrat font-extrabold text-xl">{stats[s.k]}</p>
            <p className="text-xs font-semibold mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ref, name, email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020]"/>
        </div>
       <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020] bg-white">
          <option value="all">All Statuses</option>
          {(['pending','paid','processing','shipped','delivered','cancelled','failed'] as Status[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value as typeof filterCountry)}
  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020] bg-white">
          <option value="all">All Countries</option>
          <option value="NG">🇳🇬 Nigeria</option>
          <option value="CA">🇨🇦 Canada</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 bg-white">
          From
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm text-gray-900 focus:outline-none" aria-label="Filter orders from date" />
        </label>
        <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 bg-white">
          To
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm text-gray-900 focus:outline-none" aria-label="Filter orders to date" />
        </label>
      </div>

      {/* Content */}
      {ordersLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      ) : allFiltered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 font-semibold">No orders found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Reference','Customer','Date','Total','Status','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((o: AdminOrder) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-600">{o.order_ref}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{o.country === 'NG' ? '🇳🇬' : '🇨🇦'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-gray-900">{o.customer_name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{o.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-sm text-gray-900 whitespace-nowrap">{formatPrice(o.total_amount, o.currency)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(o)} className="text-xs font-semibold text-[#E02020] hover:underline">
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pager page={page} total={allFiltered.length} onChange={setPage} />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {paginated.map((o: AdminOrder) => (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{o.customer_name}</p>
                    <p className="font-mono text-xs text-gray-400 mt-0.5">#{o.order_ref}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-500 text-xs">{formatDate(o.created_at)}</span>
                  <span className="font-montserrat font-bold text-gray-900">{formatPrice(o.total_amount, o.currency)}</span>
                </div>
                <button onClick={() => setSelected(o)}
                  className="w-full bg-[#E02020] text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">
                  Manage Order →
                </button>
              </div>
            ))}
            <Pager page={page} total={allFiltered.length} onChange={setPage} />
          </div>
        </>
      )}

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdate={async (id, s) => {
            await updateOrderStatus(id, s);
            setSelected(prev => prev ? { ...prev, status: s } : prev);
          }}
          onDelete={async (id) => {
            await deleteOrder(id);
            await fetchOrders();
          }}
        />
      )}
    </div>
  );
}
