// src/pages/Checkout.tsx

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../contexts/CartContext';
import { useCountry } from '../contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/api';
import { apiGet, apiPost, generateIdempotencyKey, RateLimitError, API_BASE } from '@/api';
import { usePageMeta, pageMeta } from '@/hooks/usePageMeta';
import { toast } from '@/hooks/use-toast';

interface DeliveryArea  { id: number; area: string; state: string; fee: number; currency: string; }
interface DiscountResult { valid: boolean; code: string; type: 'percentage'|'fixed'; value: number; discount: number; }
interface CustomerInfo  {
  firstName: string; lastName: string;
  email: string; phone: string;
  address: string; city: string; state: string;
}

const EMPTY_INFO: CustomerInfo = {
  firstName:'', lastName:'', email:'', phone:'', address:'', city:'', state:'',
};

type Step = 'info' | 'review' | 'payment';

// ── Paystack script loader (singleton) ───────────────────────────────────────
let paystackLoading = false;
let paystackReady   = !!window.PaystackPop;
const paystackCallbacks: Array<() => void> = [];

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (paystackReady) { resolve(); return; }
    paystackCallbacks.push(resolve);
    if (paystackLoading) return;
    paystackLoading = true;
    const s = document.createElement('script');
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.onload  = () => { paystackReady = true; paystackCallbacks.forEach(fn => fn()); };
    s.onerror = () => reject(new Error('Failed to load Paystack script. Check your connection.'));
    document.head.appendChild(s);
  });
}

// ── Step bar ─────────────────────────────────────────────────────────────────
const StepBar = ({ current }: { current: Step }) => {
  const steps: { id: Step; label: string }[] = [
    { id:'info', label:'Your Details' }, { id:'review', label:'Review Order' }, { id:'payment', label:'Payment' },
  ];
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 flex items-center justify-center font-montserrat font-bold text-sm transition-all ${
              i < idx ? 'bg-green-500 text-white' : i === idx ? 'bg-[#E02020] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {i < idx
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                : i + 1}
            </div>
            <span className={`mt-1.5 text-xs font-poppins font-semibold whitespace-nowrap ${
              i === idx ? 'text-[#E02020]' : i < idx ? 'text-green-600' : 'text-gray-400'
            }`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 md:w-24 h-0.5 mx-1 mb-5 ${i < idx ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const Field = ({
  label, name, type='text', value, onChange, placeholder, required=true, half=false,
}: {
  label:string; name:keyof CustomerInfo; type?:string; value:string;
  onChange:(n:keyof CustomerInfo,v:string)=>void;
  placeholder?:string; required?:boolean; half?:boolean;
}) => (
  <div className={half ? 'flex-1' : 'w-full'}>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
      {label} {required && <span className="text-[#E02020]">*</span>}
    </label>
    <input type={type} value={value} onChange={e => onChange(name, e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full px-4 py-3 border border-gray-200 text-sm focus:outline-none focus:border-[#E02020] transition-colors text-gray-900 placeholder-gray-400" />
  </div>
);

const Checkout = () => {
  usePageMeta(pageMeta.checkout.title, pageMeta.checkout.description);
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { currentData }                = useCountry();
  const { user }                       = useAuth();
  const isGuest = !user;
  const guestToken = useRef(localStorage.getItem('xpola_guest_checkout_token') || crypto.randomUUID());
  useEffect(() => { if (isGuest) localStorage.setItem('xpola_guest_checkout_token', guestToken.current); }, [isGuest]);

  const idemKey = useRef(generateIdempotencyKey());

  const [step,          setStep]         = useState<Step>('info');
  const [info,          setInfo]         = useState<CustomerInfo>({
    ...EMPTY_INFO,
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.email     ?? '',
    phone:     user?.phone     ?? '',
  });
  const [areas,         setAreas]        = useState<DeliveryArea[]>([]);
  const [areasLoading,  setAreasLoading] = useState(false);
  const [areasError,    setAreasError]   = useState('');
  const [selectedArea,  setSelectedArea] = useState<DeliveryArea | null>(null);
  const [couponCode,    setCouponCode]   = useState('');
  const [couponResult,  setCouponResult] = useState<DiscountResult | null>(null);
  const [couponLoading, setCouponLoading]= useState(false);
  const [couponError,   setCouponError]  = useState('');
  const [processing,    setProcessing]   = useState(false);
  const [error,         setError]        = useState('');
  const [serverTotal,   setServerTotal]  = useState<number | null>(null);

  // Moneris commented out until CAD payments enabled
  // const [monerisUrl,      setMonerisUrl]      = useState('');
  // const [monerisTicket,   setMonerisTicket]   = useState('');
  // const [monerisOrderRef, setMonerisOrderRef] = useState('');

  const isCanada    = false; // currentData?.code === 'CA';
  const country     = 'NG';
  const currency    = 'NGN';
  const sym         = '₦';
  const deliveryFee = selectedArea?.fee ?? 0;
  const discountAmt = couponResult?.discount ?? 0;
  const clientTotal = Math.max(0, cartTotal + deliveryFee - discountAmt);

  // ── Fetch delivery areas ──────────────────────────────────────────────────
  const fetchAreas = () => {
    setSelectedArea(null);
    setAreasError('');
    setAreasLoading(true);
    apiGet<{ data: DeliveryArea[] }>(`/delivery_fees.php?active=1&country=${country}`)
      .then(r => {
        const list = r.data ?? [];
        setAreas(list);
        if (list.length === 0) setAreasError('No delivery areas available for your region.');
      })
      .catch(err => {
        setAreas([]);
        setAreasError((err as Error).message || 'Failed to load delivery areas. Please retry.');
      })
      .finally(() => setAreasLoading(false));
  };

  useEffect(() => { fetchAreas(); }, [country]);

  if (cart.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <Link to="/" className="bg-[#E02020] text-white px-6 py-3 text-sm font-bold uppercase tracking-widest">Continue Shopping</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  // ── Coupon ────────────────────────────────────────────────────────────────
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError(''); setCouponResult(null);
    try {
      const r = await apiGet<DiscountResult>(
        `/orders.php?action=validate_discount&code=${encodeURIComponent(couponCode)}&subtotal=${cartTotal}`, true
      );
      setCouponResult(r);
      toast({ title: 'Discount applied', description: `${sym}${r.discount.toLocaleString()} off!` });
    } catch (err: unknown) {
      setCouponError((err as Error).message || 'Invalid code.');
    } finally { setCouponLoading(false); }
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const handleInfoNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!info.firstName || !info.phone || !info.address) { setError('Please fill all required fields.'); return; }
    if (!selectedArea) { setError('Please select a delivery area.'); return; }
    setError(''); setStep('review');
  };

  // ── PAYSTACK (NGN) ────────────────────────────────────────────────────────
  const initPaystack = async () => {
    const psKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
    if (!psKey) {
      setError('Payment is temporarily unavailable. Please try again later.');
      return;
    }

    // Fresh key each attempt → new order_ref → avoids duplicate ref 400
    idemKey.current = generateIdempotencyKey();

    setProcessing(true); setError('');
    let orderId = 0, orderRef = '', confirmedTotal = clientTotal;

    try {
      const saved = await apiPost<{ id: number; order_ref: string; server_total: number }>('/orders.php', {
        customer_name:    `${info.firstName} ${info.lastName}`,
        customer_email:   info.email,
        customer_phone:   info.phone,
        country:          'NG',
        delivery_address: info.address,
        delivery_city:    info.city,
        delivery_state:   selectedArea?.state ?? info.state,
        delivery_area_id: selectedArea?.id,
        delivery_fee:     deliveryFee,
        discount_code:    couponResult?.code ?? '',
        subtotal:         cartTotal,
        idempotency_key:  idemKey.current,
        guest_token:      isGuest ? guestToken.current : undefined,
        order_items: cart.map(i => ({
          id: String(i.id), name: i.name, price: i.price,
          quantity: i.quantity, currency: i.currency, image: i.image_path ?? '', category: i.category_name ?? '',
        })),
      }, true);
      orderId        = saved.id;
      orderRef       = saved.order_ref;
      confirmedTotal = saved.server_total ?? clientTotal;
      setServerTotal(confirmedTotal);
    } catch (err: unknown) {
      if (err instanceof RateLimitError) setError(`Too many requests. Please wait ${err.retryAfter}s.`);
      else setError((err as Error).message || 'Failed to create order. Please try again.');
      setProcessing(false); return;
    }

    try {
      await loadPaystackScript();
    } catch {
      setError('Could not load Paystack. Please refresh and try again.');
      setProcessing(false); return;
    }

    if (typeof (window as any).PaystackPop?.setup !== 'function') {
      setError('Paystack failed to initialise. Please refresh and try again.');
      setProcessing(false); return;
    }

    if (Math.round(confirmedTotal * 100) < 100) {
      setError('Order total is too low to process payment.');
      setProcessing(false); return;
    }

    // ── TEMP DEBUG — remove after 400 is fixed ────────────────────────────
    const debugPayload = {
      key:      psKey,
      email:    info.email?.trim() || `order-${orderId}@xpola.com`,
      amount:   Math.round(confirmedTotal * 100),
      currency: 'NGN',
      ref:      orderRef,
    };
    console.log('[Paystack payload]', JSON.stringify(debugPayload, null, 2));
    try {
      const debugRes = await fetch('https://api.paystack.co/checkout/request_inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debugPayload),
      });
      const debugJson = await debugRes.json();
      console.error('[Paystack 400 reason]', debugJson);
    } catch (debugErr) {
      console.error('[Paystack debug fetch failed]', debugErr);
    }
    // ── END DEBUG ─────────────────────────────────────────────────────────

    const onClose = () => { setProcessing(false); };

    const callback = (response: { reference: string }) => {
      const finish = async () => {
        try {
          await apiPost('/orders.php', {
            action:             'confirm_payment',
            order_id:           orderId,
            paystack_reference: response.reference,
            guest_token: guestToken.current,
          }, true);
        } catch (e: unknown) {
          console.error('Payment confirm error — webhook will handle:', e);
        }
        clearCart();
        if (isGuest) localStorage.setItem('xpola_offer_account_after_order', '1');
        navigate(`/order-success?ref=${orderRef}&id=${orderId}`);
      };
      finish();
    };

    const handler = (window as any).PaystackPop.setup({
      key:      psKey,
      email:    info.email?.trim() || `order-${orderId}@xpola.com`,
      amount:   Math.round(confirmedTotal * 100),
      currency: 'NGN',
      ref:      orderRef,
      metadata: { order_id: orderId, customer_name: `${info.firstName} ${info.lastName}` },
      onClose,
      callback,
    });

    if (!handler || typeof handler.openIframe !== 'function') {
      setError('Paystack failed to initialise. Please refresh.');
      setProcessing(false); return;
    }

    handler.openIframe();
  };

  // ── MONERIS (CAD) — commented out until CAD payments enabled ─────────────
  // const initMoneris = async () => { ... };
  // useEffect(() => { ... }, [monerisUrl, ...]);

  const handlePayment = () => initPaystack();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <StepBar current={step} />

          {/* Email verification warning */}
          {user && !(user as any).emailVerified && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 mb-6 flex items-start gap-3">
              <span className="text-amber-500 text-lg leading-none flex-shrink-0">⚠</span>
              <div>
                <p className="font-semibold">Email not verified</p>
                <p className="text-xs mt-0.5">Please verify your email before placing an order.{' '}
                  <button type="button" onClick={async () => {
                    try {
                      const token = localStorage.getItem('xpola_token');
                      const res = await fetch(`${API_BASE}/auth.php?action=resend_verification`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                      });
                      if (res.ok) toast({ title: 'Email sent', description: 'Check your inbox for the verification link.' });
                      else toast({ title: 'Failed', description: 'Could not resend. Try again later.' });
                    } catch {
                      toast({ title: 'Error', description: 'Network error. Please try again.' });
                    }
                  }} className="underline font-semibold hover:text-amber-900 transition-colors">
                    Resend verification →
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1: Info ── */}
          {step === 'info' && (
            <form onSubmit={handleInfoNext} className="space-y-5">
              <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-2">{isGuest ? "Checkout as Guest" : "Your Details"}</h2>
              {isGuest && <p className="text-sm text-gray-500 mb-6">No account is required. You can optionally create one after payment.</p>}
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3">{error}</div>}
              <div className="flex gap-3">
                <Field label="First Name" name="firstName" value={info.firstName} onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} half />
                <Field label="Last Name"  name="lastName"  value={info.lastName}  onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} half />
              </div>
              <Field label="Email"   name="email" type="email" value={info.email} onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} placeholder="you@email.com" required />
              <Field label="Phone"   name="phone" type="tel"   value={info.phone} onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} placeholder="+234 …" />
              <Field label="Delivery Address" name="address" value={info.address} onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} />
              <div className="flex gap-3">
                <Field label="City"  name="city"  value={info.city}  onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} half required={false} />
                <Field label="State" name="state" value={info.state} onChange={(n,v)=>setInfo(p=>({...p,[n]:v}))} half required={false} />
              </div>

              {/* Delivery Area */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Delivery Area <span className="text-[#E02020]">*</span>
                </label>
                {areasLoading ? (
                  <div className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Loading delivery areas…
                  </div>
                ) : areasError ? (
                  <div className="w-full px-4 py-3 border border-red-200 bg-red-50 text-red-600 text-sm flex items-center justify-between">
                    <span>{areasError}</span>
                    <button type="button" onClick={fetchAreas} className="ml-3 underline font-semibold whitespace-nowrap hover:text-red-800 transition-colors">Retry</button>
                  </div>
                ) : (
                  <select
                    value={selectedArea?.id ?? ''}
                    onChange={e => setSelectedArea(areas.find(a => Number(a.id) === Number(e.target.value)) ?? null)}
                    className="w-full px-4 py-3 border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#E02020] transition-colors"
                    required
                  >
                    <option value="">— Select delivery area —</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.area}, {a.state} — {sym}{Number(a.fee).toLocaleString()}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Coupon */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Discount Code <span className="text-gray-300">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); setCouponError(''); }}
                    placeholder="XPOLA20"
                    className="flex-1 px-4 py-3 border border-gray-200 text-sm text-gray-900 font-mono uppercase focus:outline-none focus:border-[#E02020] bg-white" />
                  <button type="button" onClick={validateCoupon} disabled={couponLoading || !couponCode.trim()}
                    className="px-5 py-3 bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors">
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponError  && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                {couponResult && <p className="text-xs text-emerald-600 mt-1 font-semibold">✓ {sym}{couponResult.discount.toLocaleString()} discount applied</p>}
              </div>

              <button type="submit" className="w-full py-4 bg-[#E02020] hover:bg-[#c01a1a] text-white font-montserrat font-bold uppercase tracking-widest text-sm transition-colors">
                Continue to Review →
              </button>
            </form>
          )}

          {/* ── Step 2: Review ── */}
          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="font-montserrat font-bold text-xl text-gray-900">Review Your Order</h2>
              <div className="border border-gray-100 divide-y divide-gray-50">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <img src={item.image_path ?? 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80'} alt={item.name} className="w-14 h-14 object-cover bg-gray-100" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity, currency as 'NGN'|'CAD')}</p>
                  </div>
                ))}
                <div className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{sym}{cartTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Delivery ({selectedArea?.area})</span><span>{sym}{deliveryFee.toLocaleString()}</span></div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({couponResult?.code})</span>
                      <span>−{sym}{discountAmt.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
                    <span>Total</span>
                    <span className="text-[#E02020]">{sym}{clientTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 text-sm text-gray-600">
                <p><strong>Delivering to:</strong> {info.address}{info.city ? `, ${info.city}` : ''}, {selectedArea?.area}</p>
                <p><strong>Contact:</strong> {info.firstName} {info.lastName} · {info.phone}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('info')} className="flex-1 py-3 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">← Back</button>
                <button onClick={() => setStep('payment')} className="flex-[2] py-3 bg-[#E02020] text-white font-montserrat font-bold uppercase tracking-widest text-sm hover:bg-[#c01a1a]">
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === 'payment' && (
            <div className="space-y-6">
              <h2 className="font-montserrat font-bold text-xl text-gray-900">Payment</h2>

              {/* Mini order summary */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 border border-gray-100">
                <p className="font-bold text-gray-900 mb-2">Order Summary</p>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between py-1">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="font-semibold flex-shrink-0">{sym}{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-[#E02020]">{sym}{(serverTotal ?? clientTotal).toLocaleString()}</span>
                </div>
              </div>

              <div className="border border-gray-100 p-5">
                <div className="flex justify-between text-lg font-bold text-gray-900 mb-1">
                  <span>Total Due</span>
                  <span className="text-[#E02020]">{sym}{(serverTotal ?? clientTotal).toLocaleString()}</span>
                </div>
                {serverTotal && serverTotal !== clientTotal && (
                  <p className="text-xs text-amber-600 mt-1">Total adjusted by server: {sym}{serverTotal.toLocaleString()}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Secure payment via Paystack · SSL encrypted</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>🔒 SSL Encrypted</span>
                  <span>·</span>
                  <span>No card data stored</span>
                  <span>·</span>
                  <span>Powered by Paystack</span>
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3">{error}</div>}

              <button onClick={handlePayment} disabled={processing}
                className="w-full py-4 bg-[#E02020] hover:bg-[#c01a1a] disabled:opacity-60 text-white font-montserrat font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors">
                {processing
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Processing…</>
                  : `🔒 Pay ${sym}${(serverTotal ?? clientTotal).toLocaleString()}`}
              </button>

              <button onClick={() => setStep('review')} className="w-full py-3 border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                ← Back to Review
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
