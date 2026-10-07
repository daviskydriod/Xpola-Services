import { useCallback, useEffect, useState } from 'react';
import { restockApi, RestockRequest } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function AdminRestock() {
  const [rows, setRows] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    restockApi.getQueue()
      .then(r => setRows(r.data ?? []))
      .catch(err => toast({ title: 'Could not load restock queue', description: err.message }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = async (row: RestockRequest, action: 'send' | 'dismiss') => {
    setBusy(row.wishlistId);
    try {
      await restockApi.handle(row.wishlistId, action);
      toast({ title: action === 'send' ? 'Restock alert sent' : 'Request dismissed', description: row.email });
      load();
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message });
    } finally { setBusy(null); }
  };

  const ready = rows.filter(r => r.stockStatus === 'in_stock');
  const waiting = rows.filter(r => r.stockStatus !== 'in_stock');
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">Restock alerts</h1>
          <p className="text-gray-500 text-sm mt-1">Review customer opt-ins and send alerts after a product is back in stock.</p>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#E02020]">Refresh</button>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4"><p className="text-2xl font-bold text-green-700">{ready.length}</p><p className="text-xs font-semibold text-green-800">Ready to notify</p></div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4"><p className="text-2xl font-bold text-yellow-700">{waiting.length}</p><p className="text-xs font-semibold text-yellow-800">Waiting for stock</p></div>
      </div>
      {loading ? <p className="text-sm text-gray-500">Loading restock requests…</p> : rows.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-500">No customers are currently waiting for a restock alert.</div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="text-left px-4 py-3">Product</th><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Opted in</th><th className="text-right px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{rows.map(row => <tr key={row.wishlistId}>
              <td className="px-4 py-3 font-semibold text-gray-900">{row.productName}<div className="text-xs text-gray-400">Product #{row.productId}</div></td>
              <td className="px-4 py-3 text-gray-700">{row.customerName || 'Customer'}<div className="text-xs text-gray-400">{row.email}</div></td>
              <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${row.stockStatus === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{row.stockStatus === 'in_stock' ? 'Ready' : 'Waiting for stock'}</span></td>
              <td className="px-4 py-3 text-xs text-gray-500">{new Date(row.optedInAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap"><button disabled={busy === row.wishlistId || row.stockStatus !== 'in_stock'} onClick={() => handle(row, 'send')} className="px-3 py-1.5 rounded-lg bg-[#E02020] text-white text-xs font-bold disabled:opacity-40">{busy === row.wishlistId ? 'Working…' : 'Send alert'}</button><button disabled={busy === row.wishlistId} onClick={() => handle(row, 'dismiss')} className="ml-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold disabled:opacity-40">Dismiss</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">Alerts are staff-managed. Sending an alert records the action and clears that customer’s opt-in so the same request is not emailed twice.</p>
    </div>
  );
}
