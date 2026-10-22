// src/pages/PaymentVerify.tsx

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta, pageMeta } from '@/hooks/usePageMeta';
import { API_BASE } from '@/api';

type VerifyState = 'loading' | 'success' | 'failed';

interface VerifyResponse {
  success: boolean;
  message: string;
  order?: {
    order_ref: string;
    total_amount: number;
    status: string;
  };
}

export default function PaymentVerify() {
  usePageMeta(pageMeta.checkout.title, pageMeta.checkout.description);

  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const [state, setState]     = useState<VerifyState>('loading');
  const [orderRef, setOrderRef] = useState('');

  useEffect(() => {
    const ref = searchParams.get('reference');
    if (!ref) { setState('failed'); return; }

    const token = localStorage.getItem('xpola_token');

    fetch(`${API_BASE}/payments/paystack_verify.php?reference=${encodeURIComponent(ref)}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(r => r.json() as Promise<VerifyResponse>)
      .then(data => {
        if (data.success) {
          setOrderRef(data.order?.order_ref ?? ref);
          setState('success');
        } else {
          setState('failed');
        }
      })
      .catch(() => setState('failed'));
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5">

          {state === 'loading' && (
            <>
              <svg className="w-10 h-10 animate-spin text-[#E02020] mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-gray-500 font-poppins text-sm">Verifying your payment…</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-montserrat font-bold text-2xl text-gray-900">Payment Confirmed!</h2>
              {orderRef && (
                <p className="text-xs text-gray-400 font-mono">Ref: {orderRef}</p>
              )}
              <p className="text-sm text-gray-500">Your order is now being processed. You'll receive a confirmation shortly.</p>
              <button
                onClick={() => navigate('/orders')}
                className="w-full py-3 bg-[#E02020] hover:bg-[#c01a1a] text-white font-montserrat font-bold uppercase tracking-widest text-sm transition-colors"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </button>
            </>
          )}

          {state === 'failed' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-[#E02020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="font-montserrat font-bold text-2xl text-gray-900">Payment Failed</h2>
              <p className="text-sm text-gray-500">We couldn't verify your payment. If you were charged, please contact support with your reference number.</p>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-[#E02020] hover:bg-[#c01a1a] text-white font-montserrat font-bold uppercase tracking-widest text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
