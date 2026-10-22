import { useCallback, useEffect, useState } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface NewsletterSubscriber {
  id: number;
  email: string;
  country: 'NG' | 'CA' | string;
  created_at: string;
}

export default function AdminNewsletter() {
  const [items, setItems] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<{ data: NewsletterSubscriber[]; total: number }>('/admin/newsletter.php', {}, localStorage.getItem('xpola_admin_token'))
      .then(res => setItems(res.data ?? []))
      .catch(err => toast({ title: 'Could not load newsletter subscribers', description: err.message }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/newsletter.php?action=export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('xpola_admin_token') ?? ''}` },
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xpola-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'CSV exported', description: `${items.length} subscriber${items.length === 1 ? '' : 's'} downloaded.` });
    } catch (err: any) {
      toast({ title: 'Could not export subscribers', description: err.message });
    } finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">Newsletter subscribers</h1>
        <p className="text-gray-500 text-sm mt-1">View the subscriber list and export it for authorised staff follow-up.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#E02020] disabled:opacity-50">Refresh</button>
          <button onClick={exportCsv} disabled={exporting || loading} className="px-4 py-2 rounded-xl bg-[#E02020] text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900">
        Newsletter sign-ups are stored by the API. There is no confirmation workflow, so the list shows only email, market, and subscription date. Handle the exported file as confidential contact data.
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-montserrat font-bold text-gray-900">Subscriber list</h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{items.length} total</span>
        </div>
        {loading ? <p className="p-6 text-sm text-gray-500">Loading subscribers…</p> : items.length === 0 ? <p className="p-6 text-sm text-gray-400">No newsletter subscribers yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Email</th><th className="px-5 py-3">Market</th><th className="px-5 py-3">Subscribed</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => <tr key={item.id} className="hover:bg-gray-50"><td className="px-5 py-3 font-semibold text-gray-900">{item.email}</td><td className="px-5 py-3 text-gray-600">{item.country === 'NG' ? 'Nigeria' : item.country === 'CA' ? 'Canada' : item.country}</td><td className="px-5 py-3 text-gray-500">{new Date(item.created_at).toLocaleString()}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
