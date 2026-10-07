// FILE PATH: src/pages/Login.tsx
// KEY CHANGES vs previous version:
//  1. useSearchParams imported — reads ?ref=CODE and ?mode=register from URL
//  2. handleRegister passes referralCode to register()
//  3. Referral banner shown on register tab when ?ref present
//  4. AuthContext.register() signature updated to accept optional referralCode

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCountry } from '@/contexts/CountryContext';

type Mode = 'login' | 'register' | 'reset';

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

export default function Login() {
  const { user, login, register, resetPassword } = useAuth();
  const { currentData } = useCountry();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [searchParams] = useSearchParams();
  const isNigeria = currentData.code === 'NG';
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/account';

  // Read URL params
  const urlMode    = searchParams.get('mode') as Mode | null;
  const urlRefCode = (searchParams.get('ref') ?? '').toUpperCase();

  const [mode,            setMode]            = useState<Mode>(urlMode === 'register' ? 'register' : 'login');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [justRegistered,  setJustRegistered]  = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName,  setRegisteredName]  = useState('');

  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFirstName,  setRegFirstName]  = useState('');
  const [regLastName,   setRegLastName]   = useState('');
  const [regEmail,      setRegEmail]      = useState('');
  const [regPhone,      setRegPhone]      = useState('');
  const [regPassword,   setRegPassword]   = useState('');
  const [regConfirm,    setRegConfirm]    = useState('');
  const [resetEmail,    setResetEmail]    = useState('');

  useEffect(() => { if (user && !justRegistered) navigate(from, { replace: true }); }, [user, justRegistered, navigate, from]);
  useEffect(() => { if (urlMode === 'register') setMode('register'); }, [urlMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(loginEmail, loginPassword); navigate(from, { replace: true }); }
    catch (err: unknown) { setError((err as Error).message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (regPassword !== regConfirm) return setError('Passwords do not match.');
    if (regPassword.length < 8)    return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      // Pass referral code from URL ?ref= param
      await register(regEmail, regPassword, regFirstName, regLastName, regPhone, currentData.code, urlRefCode || undefined);
      setRegisteredEmail(regEmail);
      setRegisteredName(regFirstName);
      setJustRegistered(true);
    }
    catch (err: unknown) { setError((err as Error).message || 'Registration failed. Try again.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await resetPassword(resetEmail); setSuccess('If this email is registered, a reset link has been sent.'); }
    catch (err: unknown) { setError((err as Error).message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 text-sm font-poppins focus:outline-none focus:border-[#E02020] transition-colors text-gray-900 placeholder-gray-400 bg-white";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-montserrat";

  if (justRegistered) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="h-1 bg-[#E02020] mt-[72px]" />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-50 border-2 border-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="font-montserrat font-extrabold text-2xl text-gray-900 mb-3">Check your inbox!</h1>
            <p className="font-poppins text-gray-500 text-sm leading-relaxed mb-2">
              Hi <strong>{registeredName}</strong>, welcome to Xpola Services!
            </p>
            <p className="font-poppins text-gray-500 text-sm leading-relaxed mb-6">
              Verification link sent to <span className="font-bold text-gray-800 break-all">{registeredEmail}</span>.
            </p>
            {urlRefCode && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-6 text-sm text-green-700">
                🎉 You joined via a referral link! Bonus activates on your first order.
              </div>
            )}
            <div className="space-y-3">
              <button onClick={() => { setJustRegistered(false); navigate('/account', { replace: true }); }}
                className="w-full bg-[#E02020] text-white font-montserrat font-bold py-3.5 hover:bg-[#c01a1a] transition-colors rounded text-sm uppercase tracking-widest">
                Go to My Account →
              </button>
              <button onClick={() => { setJustRegistered(false); navigate(isNigeria ? '/nigeria/shop' : '/canada/shop', { replace: true }); }}
                className="w-full border border-gray-200 text-gray-700 font-poppins text-sm py-3 hover:bg-gray-50 transition-colors rounded">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="h-1 bg-[#E02020] mt-[72px]" />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-[#E02020] flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="font-montserrat font-extrabold text-3xl text-gray-900 mb-1">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <p className="font-poppins text-sm text-gray-400">
              {mode === 'login' ? 'Sign in to your Xpola account'
                : mode === 'register' ? `Join Xpola ${currentData.name} ${isNigeria ? '🇳🇬' : '🇨🇦'}`
                : "We'll send a reset link to your email"}
            </p>
            {mode === 'register' && urlRefCode && (
              <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-sm text-green-700">
                🎁 Referral link applied — get 5% off your first order!
              </div>
            )}
          </div>

          {mode !== 'reset' && (
            <div className="flex border border-gray-100 mb-8">
              {(['login', 'register'] as Mode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-3 text-xs font-montserrat font-bold uppercase tracking-widest transition-colors ${mode === m ? 'bg-[#E02020] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white border border-gray-100 shadow-sm p-8">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 px-4 py-3 mb-6">
                <svg className="w-4 h-4 text-[#E02020] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="font-poppins text-xs text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-100 px-4 py-3 mb-6">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
                <p className="font-poppins text-xs text-green-700">{success}</p>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className={labelClass}>Email Address <span className="text-[#E02020]">*</span></label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="john@example.com" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Password <span className="text-[#E02020]">*</span></label>
                  <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required className={inputClass} />
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => { setMode('reset'); setError(''); }} className="font-poppins text-xs text-[#E02020] hover:underline">Forgot password?</button>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#E02020] text-white font-montserrat font-bold py-4 hover:bg-[#c01a1a] transition-colors uppercase tracking-widest text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Spinner />Signing in...</> : 'Sign In →'}
                </button>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={labelClass}>First Name <span className="text-[#E02020]">*</span></label>
                    <input type="text" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} placeholder="John" required className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Last Name <span className="text-[#E02020]">*</span></label>
                    <input type="text" value={regLastName} onChange={e => setRegLastName(e.target.value)} placeholder="Doe" required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email Address <span className="text-[#E02020]">*</span></label>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="john@example.com" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number <span className="text-[#E02020]">*</span></label>
                  <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder={isNigeria ? '+234 800 000 0000' : '+1 416 000 0000'} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Password <span className="text-[#E02020]">*</span></label>
                  <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="At least 8 characters" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-[#E02020]">*</span></label>
                  <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} placeholder="Repeat password" required className={inputClass} />
                </div>
                {urlRefCode && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded px-3 py-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    <p className="font-poppins text-xs text-green-700">Referral code: <strong className="font-mono">{urlRefCode}</strong></p>
                  </div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full bg-[#E02020] text-white font-montserrat font-bold py-4 hover:bg-[#c01a1a] transition-colors uppercase tracking-widest text-sm mt-2 disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Spinner />Creating account...</> : 'Create Account →'}
                </button>
                <p className="font-poppins text-[11px] text-gray-400 text-center pt-1">A verification email will be sent to confirm your address.</p>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label className={labelClass}>Email Address <span className="text-[#E02020]">*</span></label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="john@example.com" required className={inputClass} />
                </div>
                <button type="submit" disabled={loading || !!success}
                  className="w-full bg-[#E02020] text-white font-montserrat font-bold py-4 hover:bg-[#c01a1a] transition-colors uppercase tracking-widest text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><Spinner />Sending...</> : 'Send Reset Link →'}
                </button>
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="w-full font-poppins text-xs text-gray-500 hover:text-[#E02020] transition-colors">
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
