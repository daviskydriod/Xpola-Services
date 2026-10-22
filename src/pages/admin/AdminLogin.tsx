// FILE PATH: src/pages/admin/AdminLogin.tsx
// Changes: OTP step, change password after login
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { adminApi } from '@/lib/api';

const Spin = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const AdminLogin = () => {
  const { login, verifyOtp } = useAdmin();
  const navigate = useNavigate();

  const [step,       setStep]       = useState<'credentials' | 'otp'>('credentials');
  const [tempToken,  setTempToken]  = useState('');
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [otp,        setOtp]        = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await login(username, password);
      if (res.otpRequired && res.tempToken) {
        setTempToken(res.tempToken);
        setStep('otp');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError((err as Error).message ?? 'Login failed.');
    } finally { setLoading(false); }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const ok = await verifyOtp(tempToken, otp);
      if (ok) navigate('/admin/dashboard');
      else setError('Invalid or expired OTP. Try again.');
    } catch (err) {
      setError((err as Error).message ?? 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  const inp = "w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#E02020] transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#E02020] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="font-montserrat font-extrabold text-2xl text-white">Xpola</span>
          </div>
          <h1 className="font-montserrat font-bold text-3xl text-white mb-2">Staff Portal</h1>
          <p className="text-gray-400 text-sm">
            {step === 'credentials' ? 'Sign in to manage your store' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
          {step === 'credentials' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="staff username" required autoComplete="username" className={inp} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required autoComplete="current-password" className={inp} />
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-[#E02020] text-white font-montserrat font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spin />Signing in…</> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="text-gray-300 text-sm">Check your staff email for the 6-digit OTP. It expires in 10 minutes.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">One-Time Password</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" required maxLength={6} inputMode="numeric"
                  className={inp + " text-center text-2xl font-mono tracking-[0.5em]"} />
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading || otp.length < 6}
                className="w-full bg-[#E02020] text-white font-montserrat font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Spin />Verifying…</> : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setOtp(''); setError(''); }}
                className="w-full text-gray-400 text-sm hover:text-gray-200 transition-colors">
                ← Back to login
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">Xpola Services Staff · Secure Access</p>
      </div>
    </div>
  );
};

export default AdminLogin;
