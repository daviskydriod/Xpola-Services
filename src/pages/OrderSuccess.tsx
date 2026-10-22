// FILE PATH: src/pages/OrderSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { formatPrice } from '@/lib/api';
import { apiGet } from '@/api';

interface OrderData {
  order_ref:      string;
  customer_name:  string;
  total:          number;
  currency:       string;
  country:        string;
  payment_status: 'pending' | 'paid' | 'failed';
}

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') ?? '';

  const [order,   setOrder]   = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!ref) { setError('Missing order reference.'); setLoading(false); return; }

    apiGet<{ success: boolean; data: OrderData }>(`/orders.php?ref=${encodeURIComponent(ref)}&guest_token=${encodeURIComponent(localStorage.getItem('xpola_guest_checkout_token') || '')}`, true)
      .then(r => setOrder(r.data))
      .catch((err: unknown) => setError((err as Error).message || 'Could not load order details.'))
      .finally(() => setLoading(false));
  }, [ref]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24 pb-12">
          <div className="text-center">
            <svg className="w-8 h-8 animate-spin text-[#E02020] mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-gray-500 text-sm font-poppins">Confirming your order…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-amber-50 border-4 border-amber-400 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-amber-500">!</span>
            </div>
            <h1 className="font-montserrat font-extrabold text-2xl text-gray-900 mb-2">We couldn't confirm that order</h1>
            <p className="font-poppins text-gray-500 text-sm mb-6">
              {error || 'No matching order was found.'} If you were charged, your payment is safe — check{' '}
              <Link to="/account" className="text-[#E02020] underline">My Orders</Link>{' '}
              or contact <a href="mailto:support@xpola.com" className="text-[#E02020] underline">support@xpola.com</a>.
            </p>
            <Link to="/" className="inline-block bg-[#E02020] text-white font-montserrat font-bold py-3 px-6 text-sm uppercase tracking-widest hover:bg-[#c01a1a] transition-colors">
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Payment still pending (e.g. verification failed/webhook hasn't landed yet) ──
  if (order.payment_status !== 'paid') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-amber-50 border-4 border-amber-400 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-amber-500">⏳</span>
            </div>
            <h1 className="font-montserrat font-extrabold text-2xl text-gray-900 mb-2">Order {order.order_ref}</h1>
            <p className="font-poppins text-gray-500 text-sm mb-6">
              We're still confirming your payment with Paystack. This can take a moment — refresh shortly,
              or check <Link to="/account" className="text-[#E02020] underline">My Orders</Link> for the latest status.
              If you were charged and this persists, contact{' '}
              <a href="mailto:support@xpola.com" className="text-[#E02020] underline">support@xpola.com</a>.
            </p>
            <Link to="/account" className="inline-block bg-[#E02020] text-white font-montserrat font-bold py-3 px-6 text-sm uppercase tracking-widest hover:bg-[#c01a1a] transition-colors">
              View My Orders
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Confirmed success ────────────────────────────────────────────────────
  const shopPath = order.country === 'CA' ? '/canada/shop' : '/nigeria/shop';
  const offerAccount = localStorage.getItem('xpola_offer_account_after_order') === '1';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="h-1 bg-green-500 mt-[72px]" />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">

          {/* Check */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-green-50 border-4 border-green-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-montserrat font-extrabold text-3xl text-gray-900 mb-2">Payment Successful!</h1>
            <p className="font-poppins text-gray-500">
              Thank you, <span className="font-semibold text-gray-900">{order.customer_name}</span>. Your order has been placed.
            </p>
          </div>

          {/* Card */}
          <div className="border border-gray-100 shadow-sm mb-6">
            <div className="h-1 bg-[#E02020]" />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between py-3 border-b border-gray-50">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest font-montserrat mb-1">Order Reference</p>
                  <p className="font-mono font-bold text-gray-900 text-sm break-all">{order.order_ref}</p>
                </div>
                <span className="flex-shrink-0 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 font-poppins ml-3">CONFIRMED</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t-2 border-gray-900">
                <span className="font-montserrat font-bold text-gray-900 uppercase tracking-wide">Amount Paid</span>
                <span className="font-montserrat font-extrabold text-2xl text-gray-900">{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="bg-gray-50 border border-gray-100 p-5 mb-8">
            <h3 className="font-montserrat font-bold text-gray-900 mb-3 text-sm uppercase tracking-widest">What happens next?</h3>
            <div className="space-y-3">
              {[
                'Our team will review and process your order within 24 hours.',
                'You will receive a shipping update with tracking details.',
                'Track your order history under My Account → Orders.',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-[#E02020] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 font-montserrat">{i + 1}</span>
                  <p className="font-poppins text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {offerAccount && <div className="bg-blue-50 border border-blue-200 p-4 mb-5 text-sm text-blue-900">Want faster checkout next time? <Link to="/login?mode=register" className="font-semibold underline">Create an account</Link> — your cart and order details are already kept in this browser.</div>}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Link to="/account" className="flex-1 bg-[#E02020] text-white font-montserrat font-bold py-4 text-sm uppercase tracking-widest hover:bg-[#c01a1a] transition-colors text-center">
              Go to Dashboard
            </Link>
            <Link to="/account" className="flex-1 border border-gray-200 text-gray-700 font-montserrat font-bold py-4 text-sm uppercase tracking-wide hover:bg-gray-50 transition-colors text-center">
              View My Orders
            </Link>
          </div>

          <Link to={shopPath} className="block text-center font-poppins text-sm text-gray-500 hover:text-[#E02020] transition-colors py-2">
            ← Continue Shopping
          </Link>

          <p className="text-center font-poppins text-xs text-gray-400 mt-6">
            Questions? <a href="mailto:support@xpola.com" className="text-[#E02020] hover:underline">support@xpola.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}