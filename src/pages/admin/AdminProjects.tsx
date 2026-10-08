import { useCallback, useEffect, useState } from 'react';
import { adminProjectsApi, Project } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const empty: Omit<Project, 'id' | 'created_at' | 'updated_at'> = { title: '', slug: '', summary: '', description: '', sector: '', country: 'NG', image_url: '', client_name: '', project_year: '', sort_order: 0, is_published: 0 };
const input = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020]';

export default function AdminProjects() {
  const [items, setItems] = useState<Project[]>([]);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => { setLoading(true); adminProjectsApi.getAll().then(r => setItems(r.data ?? [])).catch(e => toast({ title: 'Could not load projects', description: e.message })).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const set = (key: keyof typeof empty, value: string | number | boolean) => setForm(prev => ({ ...prev, [key]: value }));
  const edit = (p: Project) => { setEditing(p.id); setForm({ title: p.title, slug: p.slug, summary: p.summary ?? '', description: p.description ?? '', sector: p.sector ?? '', country: p.country, image_url: p.image_url ?? '', client_name: p.client_name ?? '', project_year: p.project_year ?? '', sort_order: p.sort_order, is_published: p.is_published }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setEditing(null); setForm(empty); };
  const save = async () => { if (!form.title.trim()) return toast({ title: 'Title required', description: 'Add a project title before saving.' }); setSaving(true); try { if (editing) await adminProjectsApi.update(editing, form); else await adminProjectsApi.create(form); toast({ title: editing ? 'Project updated' : 'Project saved', description: form.is_published ? 'It is marked for publication when the public flag is enabled.' : 'Saved as a draft.' }); reset(); load(); } catch (e: any) { toast({ title: 'Could not save project', description: e.message }); } finally { setSaving(false); } };
  const remove = async (id: number) => { if (!window.confirm('Delete this project?')) return; try { await adminProjectsApi.delete(id); load(); } catch (e: any) { toast({ title: 'Could not delete project', description: e.message }); } };
  return <div className="space-y-6">
    <div><h1 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">Projects</h1><p className="text-gray-500 text-sm mt-1">Manage project drafts and approved case studies. Public publication is currently switched off.</p></div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-montserrat font-bold text-gray-900">{editing ? 'Edit project' : 'Add project draft'}</h2>{editing && <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-900">Cancel edit</button>}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Title *<input className={input+' mt-1 normal-case font-normal tracking-normal'} value={form.title} onChange={e => set('title', e.target.value)} /></label>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sector<input className={input+' mt-1 normal-case font-normal tracking-normal'} value={form.sector} onChange={e => set('sector', e.target.value)} placeholder="Construction, Logistics…" /></label>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Country<select className={input+' mt-1 normal-case font-normal tracking-normal bg-white'} value={form.country} onChange={e => set('country', e.target.value)}><option value="NG">Nigeria</option><option value="CA">Canada</option></select></label>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project year<input className={input+' mt-1 normal-case font-normal tracking-normal'} value={form.project_year} onChange={e => set('project_year', e.target.value)} placeholder="2026" /></label>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client name (optional)<input className={input+' mt-1 normal-case font-normal tracking-normal'} value={form.client_name} onChange={e => set('client_name', e.target.value)} /></label>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Image URL<input className={input+' mt-1 normal-case font-normal tracking-normal'} value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…" /></label>
      </div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Summary<textarea className={input+' mt-1 normal-case font-normal tracking-normal'} rows={2} value={form.summary} onChange={e => set('summary', e.target.value)} /></label>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Description<textarea className={input+' mt-1 normal-case font-normal tracking-normal'} rows={4} value={form.description} onChange={e => set('description', e.target.value)} /></label>
      <div className="flex flex-wrap items-center gap-4"><label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sort order<input type="number" className={input+' mt-1 w-24 normal-case font-normal tracking-normal'} value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value) || 0)} /></label><label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mt-4"><input type="checkbox" checked={!!form.is_published} onChange={e => set('is_published', e.target.checked ? 1 : 0)} className="accent-[#E02020]" /> Approved/published</label></div>
      <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#E02020] text-white text-sm font-bold disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Update project' : 'Save draft'}</button>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-gray-100 flex justify-between"><h2 className="font-montserrat font-bold text-gray-900">Project records</h2><button onClick={load} className="text-sm text-gray-500 hover:text-gray-900">Refresh</button></div>{loading ? <p className="p-5 text-sm text-gray-500">Loading…</p> : items.length === 0 ? <p className="p-5 text-sm text-gray-500">No project records yet.</p> : <div className="divide-y divide-gray-100">{items.map(p => <div key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><h3 className="font-semibold text-gray-900">{p.title}</h3><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.is_published ? 'Approved' : 'Draft'}</span></div><p className="text-xs text-gray-500 mt-1">{p.country === 'NG' ? 'Nigeria' : 'Canada'}{p.sector ? ` · ${p.sector}` : ''}{p.project_year ? ` · ${p.project_year}` : ''}</p></div><div className="flex gap-2"><button onClick={() => edit(p)} className="px-3 py-2 rounded-lg bg-gray-100 text-xs font-bold text-gray-700">Edit</button><button onClick={() => remove(p.id)} className="px-3 py-2 rounded-lg bg-red-50 text-xs font-bold text-red-600">Delete</button></div></div>)}</div>}</div>
  </div>;
}
