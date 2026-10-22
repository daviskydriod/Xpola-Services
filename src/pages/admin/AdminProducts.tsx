// FILE PATH: src/pages/admin/AdminProducts.tsx
// MVP Update: Multi-image gallery + Variations (size, color, weight, type) support
import { useState, useRef, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { ApiCategory, ApiProduct, ProductVariation, adminProductsApi, apiFetch, categoriesApi } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
const TOKEN_KEY = 'xpola_admin_token';
const SITE_URL  = (import.meta.env.VITE_APP_URL ?? 'https://xpolaservices.com').replace(/\/$/, '');

function resolveImgUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return SITE_URL + path;
  return null;
}

const Icon = ({ path, className = 'w-5 h-5' }: { path: string | string[]; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {(Array.isArray(path) ? path : [path]).map((d, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    ))}
  </svg>
);

// ── Simple rich-text editor ──────────────────────────────────────────────────
const RichTextEditor = ({ value, onChange, label = 'Full Description *' }: {
  value: string;
  onChange: (html: string) => void;
  label?: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value || '';
  }, [value]);

  const run = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? '');
  };

  const addLink = () => {
    const url = linkUrl.trim() || window.prompt('Enter the link URL (https://...)');
    if (!url) return;
    run('createLink', url);
    setLinkUrl('');
  };

  const addImage = () => {
    const url = window.prompt('Enter an image URL (https://...)');
    if (url?.trim()) run('insertImage', url.trim());
  };

  const button = 'px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#E02020]';
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-[#E02020]">
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border-b border-gray-200">
          <button type="button" title="Bold" onMouseDown={e => e.preventDefault()} onClick={() => run('bold')} className={button}>B</button>
          <button type="button" title="Italic" onMouseDown={e => e.preventDefault()} onClick={() => run('italic')} className={`${button} italic`}>I</button>
          <select aria-label="Text style" defaultValue="p" onChange={e => run('formatBlock', e.target.value)} className={button + ' bg-white'}>
            <option value="p">Paragraph</option><option value="h2">Heading</option><option value="h3">Small heading</option>
          </select>
          <button type="button" title="Bulleted list" onMouseDown={e => e.preventDefault()} onClick={() => run('insertUnorderedList')} className={button}>• List</button>
          <button type="button" title="Numbered list" onMouseDown={e => e.preventDefault()} onClick={() => run('insertOrderedList')} className={button}>1. List</button>
          <div className="flex items-center gap-1 ml-auto">
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Link URL" className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900" />
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={addLink} className={button}>Link</button>
            <button type="button" onClick={addImage} className={button}>Image</button>
          </div>
        </div>
        <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
          onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
          className="min-h-36 max-h-64 overflow-y-auto px-4 py-3 text-sm text-gray-900 outline-none prose prose-sm max-w-none"
          data-placeholder="Write a clear product description…" />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Use headings, bold, italic, lists, links, and image URLs to format the product description.</p>
    </div>
  );
};

// ── Single image uploader ─────────────────────────────────────────────────────
const ImageUploader = ({ current, onUpload, label = 'Primary Image' }: {
  current: string; onUpload: (url: string) => void; label?: string;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState(resolveImgUrl(current) ?? current);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');

  useEffect(() => { setPreview(resolveImgUrl(current) ?? current); }, [current]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return setError('Only image files allowed.');
    if (file.size > 5 * 1024 * 1024) return setError('Image must be under 5 MB.');
    setError('');
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const form = new FormData();
    form.append('image', file);
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      setUploading(false); setProgress(0);
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.image_path) onUpload(res.image_path);
        else setError(res.error ?? 'Upload failed');
      } catch { setError('Server error during upload'); }
    };
    xhr.onerror = () => { setUploading(false); setError('Upload failed — check network.'); };
    xhr.open('POST', `${API_BASE}/admin/upload.php`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem(TOKEN_KEY) ?? ''}`);
    xhr.send(form);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      {preview ? (
        <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt="Preview" className="w-full h-full object-cover"
            onError={() => setPreview('')} />
          <button onClick={() => { setPreview(''); onUpload(''); }}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
            <Icon path="M6 18L18 6M6 6l12 12" className="w-3.5 h-3.5" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700">
                Uploading… {progress}%
              </div>
            </div>
          )}
        </div>
      ) : (
        <button type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#E02020] hover:text-[#E02020] transition-colors cursor-pointer">
          <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-8 h-8" />
          <p className="text-sm font-semibold">Click or drag image here</p>
          <p className="text-xs">Max 5 MB</p>
        </button>
      )}
      {!preview && (
        <input placeholder="Or paste image URL (https://…)" value={current.startsWith('http') ? current : ''}
          onChange={e => { onUpload(e.target.value); setPreview(e.target.value); }}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020]" />
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// ── Variations editor ─────────────────────────────────────────────────────────
const VARIATION_TYPES = ['size', 'color', 'weight', 'material', 'type', 'style'];

interface VarRow { type: string; label: string; value: string; price_delta: number; stock_qty: number; sku: string; }
const EMPTY_VAR: VarRow = { type: 'size', label: 'Size', value: '', price_delta: 0, stock_qty: 0, sku: '' };

const VariationsEditor = ({ variations, onChange }: {
  variations: VarRow[];
  onChange: (v: VarRow[]) => void;
}) => {
  const inp = "px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#E02020] bg-white";

  const update = (i: number, k: keyof VarRow, v: string | number) => {
    onChange(variations.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Product Variations</label>
        <button type="button" onClick={() => onChange([...variations, { ...EMPTY_VAR }])}
          className="flex items-center gap-1.5 text-xs font-bold text-[#E02020] hover:underline">
          <Icon path="M12 4v16m8-8H4" className="w-3.5 h-3.5" /> Add Variation
        </button>
      </div>

      {variations.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
          No variations yet. Add size, color, weight etc.
        </p>
      ) : (
        <div className="space-y-2">
          {variations.map((v, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
                  <select value={v.type} onChange={e => {
                    const t = e.target.value;
                    const label = t.charAt(0).toUpperCase() + t.slice(1);
                    onChange(variations.map((r, idx) => idx === i ? { ...r, type: t, label } : r));
                  }} className={inp + " w-full"}>
                    {VARIATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label</label>
                  <input type="text" value={v.label} onChange={e => update(i, 'label', e.target.value)}
                    placeholder="e.g. Size" className={inp + " w-full"} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Value *</label>
                  <input type="text" value={v.value} onChange={e => update(i, 'value', e.target.value)}
                    placeholder="e.g. XL, Red, 1kg" className={inp + " w-full"} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price +/-</label>
                  <input type="number" step="0.01" value={v.price_delta} onChange={e => update(i, 'price_delta', parseFloat(e.target.value) || 0)}
                    className={inp + " w-full"} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stock Qty</label>
                  <input type="number" min="0" value={v.stock_qty} onChange={e => update(i, 'stock_qty', parseInt(e.target.value) || 0)}
                    className={inp + " w-full"} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">SKU</label>
                  <input type="text" value={v.sku} onChange={e => update(i, 'sku', e.target.value)}
                    placeholder="Optional" className={inp + " w-full"} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => onChange(variations.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500 font-semibold hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  id?: number;
  name: string; summary: string; description: string; specifications: string; brand: string; warranty: string; price: string;
  currency: string; country: 'NG' | 'CA'; category_id: string;
  image_path: string; stock_status: string; stock_qty: string; featured: boolean; tags: string;
  variations: VarRow[];
}
const EMPTY: FormState = {
  name: '', summary: '', description: '', specifications: '', brand: '', warranty: '', price: '', currency: 'NGN',
  country: 'NG', category_id: '', image_path: '',
  stock_status: 'in_stock', stock_qty: '', featured: false, tags: '', variations: [],
};

const STEPS = ['Basics', 'Pricing', 'Images & Variations'] as const;

// ── Product Modal ─────────────────────────────────────────────────────────────
const ProductModal = ({
  initial, categories, onSave, onCancel, saving, existingProduct,
}: {
  initial: FormState; categories: ApiCategory[];
  onSave: (f: FormState) => void; onCancel: () => void; saving: boolean;
  existingProduct?: ApiProduct;
}) => {
  const [form, setForm]   = useState(initial);
  const [step, setStep]   = useState(0);
  // Extra images state (for existing products only)
  const [extraImgs, setExtraImgs]     = useState<{ id: number; image_path: string }[]>(existingProduct?.images ?? []);
  const [imgUploading, setImgUploading] = useState(false);
  const extraImgRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormState, v: unknown) => setForm(prev => ({ ...prev, [k]: v }));
  const cats = categories.filter((c: any) => !c.country || c.country === form.country);
  const inp  = 'w-full px-4 py-2.5 border border-gray-200 text-sm rounded-xl focus:outline-none focus:border-[#E02020] text-gray-900 bg-white';
  const lbl  = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5';

  const canNext0 = !!form.name && !!form.country;
  const canNext1 = !!form.price;
  const canSave  = canNext0 && canNext1 && form.stock_qty.trim() !== '';

  const handleAddExtraImage = async (file: File) => {
    if (!existingProduct?.id) return;
    setImgUploading(true);
    try {
      const res = await adminProductsApi.addImage(existingProduct.id, file);
      setExtraImgs(prev => [...prev, { id: res.id, image_path: res.image_path }]);
    } catch (e) { console.error(e); }
    finally { setImgUploading(false); }
  };

  const handleDeleteExtraImage = async (imgId: number) => {
    try {
      await adminProductsApi.deleteImage(imgId);
      setExtraImgs(prev => prev.filter(i => i.id !== imgId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-5xl mx-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-montserrat font-bold text-gray-900">
              {form.id ? 'Edit Product' : 'Add New Product'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button onClick={onCancel} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-semibold text-gray-700">
            <Icon path="M15 19l-7-7 7-7" className="w-4 h-4" />
            Back to Products
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-colors ${i <= step ? 'bg-[#E02020]' : 'bg-gray-100'}`} />
              <span className={`text-[10px] font-bold ${i === step ? 'text-[#E02020]' : i < step ? 'text-gray-400' : 'text-gray-300'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-230px)] overflow-y-auto">

          {/* Step 0: Basics */}
          {step === 0 && (
            <>
              <div>
                <label className={lbl}>Product Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Enter product name" className={inp} autoFocus />
              </div>
              <div>
                <label className={lbl}>Short Summary (for cards)</label>
                <input value={form.summary} onChange={e => set('summary', e.target.value)} className={inp} placeholder="One-sentence product summary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Brand</label><input value={form.brand} onChange={e => set('brand', e.target.value)} className={inp} placeholder="Brand" /></div>
                <div><label className={lbl}>Warranty</label><input value={form.warranty} onChange={e => set('warranty', e.target.value)} className={inp} placeholder="e.g. 12 months" /></div>
              </div>
              <RichTextEditor value={form.description} onChange={html => set('description', html)} />
              <div><label className={lbl}>Specifications</label><textarea value={form.specifications} onChange={e => set('specifications', e.target.value)} className={inp + ' min-h-24'} placeholder="Key: value, one per line" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Market *</label>
                  <select value={form.country} onChange={e => {
                    const c = e.target.value as 'NG' | 'CA';
                    set('country', c); set('currency', c === 'CA' ? 'CAD' : 'NGN'); set('category_id', '');
                  }} className={inp}>
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Category</label>
                  <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inp}>
                    <option value="">Select…</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Tags</label>
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="e.g. electronics, new arrival" className={inp} />
                <p className="text-[10px] text-gray-400 mt-1">Separate tags with commas</p>
              </div>
            </>
          )}

          {/* Step 1: Pricing */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Base Price *</label>
                  <input type="number" min="0" step="0.01" value={form.price}
                    onChange={e => set('price', e.target.value)} placeholder="0.00" className={inp} autoFocus />
                </div>
                <div>
                  <label className={lbl}>Currency</label>
                  <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inp}>
                    <option value="NGN">NGN (₦)</option>
                    <option value="CAD">CAD (CA$)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Stock Status</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['in_stock', 'out_of_stock'] as const).map(s => (
                    <button key={s} type="button" onClick={() => set('stock_status', s)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        form.stock_status === s
                          ? s === 'in_stock' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}>
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s === 'in_stock' ? 'bg-green-500' : 'bg-red-400'}`} />
                      {s === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Available Quantity *</label>
                <input type="number" min="0" step="1" value={form.stock_qty}
                  onChange={e => {
                    const value = e.target.value;
                    set('stock_qty', value);
                    if (form.stock_qty === '0' && value !== '' && Number(value) > 0) set('stock_status', 'in_stock');
                  }} placeholder="Enter total units available" className={inp} required />
                <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                  Enter the total units available. Customers cannot add more than this number, and checkout reserves the quantity. Use 0 to keep the product unavailable.
                </p>
              </div>
              <button type="button" onClick={() => set('featured', !form.featured)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  form.featured ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}>
                <span className="text-lg">⭐</span>
                <span>{form.featured ? 'Featured product — will appear on homepage' : 'Mark as featured product'}</span>
              </button>
            </>
          )}

          {/* Step 2: Images & Variations */}
          {step === 2 && (
            <>
              <ImageUploader current={form.image_path} onUpload={url => set('image_path', url)} />

              {/* Extra images — only for existing products */}
              {existingProduct?.id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Additional Images</label>
                    <button type="button" onClick={() => extraImgRef.current?.click()}
                      disabled={imgUploading}
                      className="flex items-center gap-1 text-xs font-bold text-[#E02020] hover:underline disabled:opacity-50">
                      <Icon path="M12 4v16m8-8H4" className="w-3.5 h-3.5" />
                      {imgUploading ? 'Uploading…' : 'Add Image'}
                    </button>
                    <input ref={extraImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAddExtraImage(f); e.target.value = ''; }} />
                  </div>
                  {extraImgs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3 border-2 border-dashed border-gray-200 rounded-xl">
                      No additional images. Click "Add Image" to upload more.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {extraImgs.map(img => {
                        const src = resolveImgUrl(img.image_path);
                        return (
                          <div key={img.id} className="relative h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            {src && <img src={src} alt="" className="w-full h-full object-cover" />}
                            <button type="button" onClick={() => handleDeleteExtraImage(img.id)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                              <Icon path="M6 18L18 6M6 6l12 12" className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {extraImgs.length === 0 && (
                    <p className="text-[10px] text-gray-400">
                      Note: Additional images are saved immediately. They appear in the product gallery on the store.
                    </p>
                  )}
                </div>
              )}
              {!existingProduct?.id && (
                <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  💡 Save this product first, then re-open it to add more images.
                </p>
              )}

              {/* Variations */}
              <VariationsEditor
                variations={form.variations}
                onChange={v => set('variations', v)}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
              <Icon path="M15 19l-7-7 7-7" className="w-4 h-4" /> Back
            </button>
          ) : (
            <button onClick={onCancel}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              disabled={step === 0 ? !canNext0 : !canNext1}
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 bg-[#E02020] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-40">
              Next <Icon path="M9 5l7 7-7 7" className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={saving || !canSave}
              onClick={() => onSave(form)}
              className="flex items-center gap-2 bg-[#E02020] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-40">
              {saving ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Saving…</>
              ) : (
                <><Icon path="M5 13l4 4L19 7" className="w-4 h-4" /> {form.id ? 'Save Changes' : 'Add Product'}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main AdminProducts ────────────────────────────────────────────────────────
export default function AdminProducts() {
  const { products, productsLoading, fetchProducts, createProduct, updateProduct, deleteProduct } = useAdmin();
  const [categories,    setCategories]    = useState<ApiCategory[]>([]);
  const [editing,       setEditing]       = useState<FormState | null>(null);
  const [editProduct,   setEditProduct]   = useState<ApiProduct | undefined>(undefined);
  const [saving,        setSaving]        = useState(false);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [search,        setSearch]        = useState('');
  const [filterCountry, setFilterCountry] = useState<'all' | 'NG' | 'CA'>('all');
  const [filterStock,   setFilterStock]   = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  useEffect(() => {
    fetchProducts();
    categoriesApi.adminGetAll()
      .then(d => setCategories(d.data ?? []))
      .catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const m = p.name.toLowerCase().includes(search.toLowerCase()) || (p.category_name ?? '').toLowerCase().includes(search.toLowerCase());
    const c = filterCountry === 'all' || p.country === filterCountry;
    const s = filterStock   === 'all' || p.stock_status === filterStock;
    return m && c && s;
  });

  const handleSave = async (form: FormState) => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.id) fd.append('id', String(form.id));
      fd.append('name',         form.name);
      fd.append('summary', form.summary);
      fd.append('description', form.description);
      fd.append('specifications', form.specifications);
      fd.append('brand', form.brand);
      fd.append('warranty', form.warranty);
      fd.append('price',        form.price);
      fd.append('currency',     form.currency);
      fd.append('country',      form.country);
      fd.append('category_id',  form.category_id);
      fd.append('stock_status', form.stock_status);
      fd.append('stock_qty',    form.stock_qty);
      fd.append('featured',     form.featured ? '1' : '0');
      fd.append('tags',         form.tags);
      if (form.image_path?.startsWith('http'))     fd.append('image_url',  form.image_path);
      else if (form.image_path?.startsWith('/'))   fd.append('image_path', form.image_path);
      // Send variations as JSON
      if (form.variations.length > 0) {
        fd.append('variations', JSON.stringify(form.variations));
      }
      if (form.id) await updateProduct(fd);
      else         await createProduct(fd);
      setEditing(null);
      setEditProduct(undefined);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    setDeleteId(null);
  };

  const openEdit = (p: ApiProduct) => {
    setEditProduct(p);
    setEditing({
      id: p.id, name: p.name, summary: p.summary ?? '', description: p.description ?? '', specifications: p.specifications ?? '', brand: p.brand ?? '', warranty: p.warranty ?? '', price: String(p.price),
      currency: p.currency, country: p.country,
      category_id: p.category_id ? String(p.category_id) : '',
      image_path: p.image_path ?? '', stock_status: p.stock_qty != null && Number(p.stock_qty) <= 0 ? 'out_of_stock' : p.stock_status,
      stock_qty: p.stock_qty == null ? '' : String(p.stock_qty),
      featured: p.featured === 1, tags: p.tags ?? '',
      variations: (p.variations ?? []).map(v => ({
        type:        v.type,
        label:       v.label,
        value:       v.value,
        price_delta: v.price_delta,
        stock_qty:   v.stock_qty,
        sku:         v.sku ?? '',
      })),
    });
  };

  if (editing) {
    return (
      <ProductModal
        initial={editing}
        categories={categories}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setEditProduct(undefined); }}
        saving={saving}
        existingProduct={editProduct}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-montserrat font-bold text-xl text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} total · {filtered.length} shown</p>
          <p className="text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2 text-xs max-w-xl">
            These are sample products. Staff manage the catalogue here: add products, edit details, assign categories, set stock and use the filters below. No owner-supplied catalogue is required for this demo data.
          </p>
        </div>
        <button onClick={() => { setEditing({ ...EMPTY }); setEditProduct(undefined); }}
          className="flex items-center gap-2 bg-[#E02020] text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">
          <Icon path="M12 4v16m8-8H4" className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#E02020]" />
        </div>
       <select value={filterCountry} onChange={e => setFilterCountry(e.target.value as any)}
  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020] bg-white">
          <option value="all">All Markets</option>
          <option value="NG">🇳🇬 Nigeria</option>
          <option value="CA">🇨🇦 Canada</option>
        </select>
       <select value={filterStock} onChange={e => setFilterStock(e.target.value as any)}
  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#E02020] bg-white">
          <option value="all">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {productsLoading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-[#E02020]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const imgSrc = resolveImgUrl(p.image_path);
            const varCount = (p.variations ?? []).length;
            const imgCount = (p.images ?? []).length;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                <div className="relative h-44 bg-gray-100 flex-shrink-0">
                  {imgSrc ? (
                    <img src={imgSrc} alt={p.name} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock_status === 'in_stock' && (p.stock_qty == null || Number(p.stock_qty) > 0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.stock_status === 'in_stock' && (p.stock_qty == null || Number(p.stock_qty) > 0) ? (p.stock_qty == null ? 'In Stock' : `${p.stock_qty} left`) : 'Out of Stock'}
                    </span>
                    {p.featured === 1 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⭐</span>}
                    {varCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{varCount} var</span>}
                    {imgCount > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">+{imgCount} img</span>}
                  </div>
                  <span className="absolute top-2 right-2 text-base">{p.country === 'NG' ? '🇳🇬' : '🇨🇦'}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.category_name ?? '—'}</p>
                  <p className="font-montserrat font-bold text-gray-900 mt-2 text-base">
                    {p.currency === 'NGN' ? '₦' : 'CA$'}{Number(p.price).toLocaleString()}
                  </p>
                  {varCount > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[...new Set((p.variations ?? []).map(v => v.type))].map(t => (
                        <span key={t} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold capitalize">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-3">
                    <button onClick={() => openEdit(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 font-semibold py-2 rounded-xl text-xs hover:bg-gray-50 transition-colors">
                      <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 text-red-500 font-semibold py-2 rounded-xl text-xs hover:bg-red-50 transition-colors">
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-montserrat font-bold text-gray-900 text-center mb-2">Delete Product?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This will also delete all images and variations. Cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
