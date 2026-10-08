import { useCallback, useEffect, useState } from 'react';
import { adminNotificationsApi, StockNotification } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type NotificationData = {
  lowStock: StockNotification[];
  outOfStock: StockNotification[];
  restockRequests: number;
  total: number;
};

export default function AdminNotifications({ onRestock }: { onRestock: () => void }) {
  const [data, setData] = useState<NotificationData>({ lowStock: [], outOfStock: [], restockRequests: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    adminNotificationsApi.get()
      .then(r => setData(r.data))
      .catch(err => toast({ title: 'Could not load notifications', description: err.message }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const ProductRows = ({ rows, tone }: { rows: StockNotification[]; tone: 'yellow' | 'red' }) => (
    <div className="divide-y divide-gray-100">
      {rows.length === 0 ? <p className="p-5 text-sm text-gray-400">No products in this group.</p> : rows.map(row => (
        <div key={row.id} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="min-w-0"><p className="font-semibold text-sm text-gray-900 truncate">{row.name}</p><p className="text-xs text-gray-400">{row.country === 'NG' ? 'Nigeria' : 'Canada'} · Product #{row.id}</p></div>
          <span className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${tone === 'red' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{row.variationStock === null ? 'Manual status' : `${row.variationStock} units`}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">Notifications</h1><p className="text-gray-500 text-sm mt-1">Stock alerts and customer restock requests requiring staff attention.</p></div><button onClick={load} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#E02020]">Refresh</button></div>
      {loading ? <p className="text-sm text-gray-500">Loading notifications…</p> : <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4"><p className="text-2xl font-bold text-yellow-700">{data.lowStock.length}</p><p className="text-xs font-semibold text-yellow-800">Low stock</p></div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4"><p className="text-2xl font-bold text-red-700">{data.outOfStock.length}</p><p className="text-xs font-semibold text-red-800">Out of stock</p></div>
          <button onClick={onRestock} className="text-left bg-blue-50 border border-blue-100 rounded-2xl p-4 hover:border-blue-300"><p className="text-2xl font-bold text-blue-700">{data.restockRequests}</p><p className="text-xs font-semibold text-blue-800">Restock requests →</p></button>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4"><p className="text-2xl font-bold text-gray-700">{data.total}</p><p className="text-xs font-semibold text-gray-600">Total notifications</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-yellow-100 rounded-2xl shadow-sm overflow-hidden"><div className="px-5 py-4 bg-yellow-50 border-b border-yellow-100"><h2 className="font-montserrat font-bold text-sm text-yellow-900">Low stock</h2><p className="text-xs text-yellow-700 mt-1">Variation stock from 1 to 5 units.</p></div><ProductRows rows={data.lowStock} tone="yellow" /></div>
          <div className="bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden"><div className="px-5 py-4 bg-red-50 border-b border-red-100"><h2 className="font-montserrat font-bold text-sm text-red-900">Out of stock</h2><p className="text-xs text-red-700 mt-1">These products remain visible publicly but cannot be added to cart.</p></div><ProductRows rows={data.outOfStock} tone="red" /></div>
        </div>
        {data.restockRequests > 0 && <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-montserrat font-bold text-sm text-blue-900">Customer restock requests</h2><p className="text-xs text-blue-700 mt-1">{data.restockRequests} customer request{data.restockRequests === 1 ? '' : 's'} waiting for staff review.</p></div><button onClick={onRestock} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Open restock queue</button></div>}
      </>}
      <p className="text-xs text-gray-400">Low stock is calculated from product variations. Products without variations use the explicit product stock status managed in Admin → Products.</p>
    </div>
  );
}
