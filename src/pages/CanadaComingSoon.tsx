import { Link } from 'react-router-dom';

export default function CanadaComingSoon() {
  return (
    <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E02020] shadow-[0_0_50px_rgba(224,32,32,0.35)]">
          <span className="text-3xl" aria-hidden="true">🇨🇦</span>
        </div>
        <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.35em] text-[#E02020]">
          Canada Market
        </p>
        <h1 className="font-montserrat text-4xl font-black leading-tight sm:text-6xl">
          Coming Soon
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-poppins text-base leading-8 text-white/65 sm:text-lg">
          The Canada marketplace is currently switched off while Moneris setup is completed.
          Canadian visitors cannot place marketplace orders or check out right now; the Canada site remains available for company information, services, and enquiries.
        </p>
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left">
          <p className="font-montserrat text-sm font-bold text-white">What can Canadian visitors do now?</p>
          <p className="mt-2 font-poppins text-sm leading-6 text-white/55">
            Use the Canada site to learn about Xpola Services or send an enquiry. Staff should explain that ordering is unavailable until Moneris is enabled; no Canadian order should be accepted manually as a workaround.
          </p>
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/canada/contact"
          className="mt-10 inline-flex items-center justify-center rounded-xl bg-[#E02020] px-7 py-3.5 font-montserrat text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c01a1a]"
        >
          Ask about Canada services →
        </Link>
        <Link
          to="/nigeria"
          className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-3.5 font-montserrat text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
        >
          Continue to Nigeria Market →
        </Link>
        </div>
      </div>
    </main>
  );
}
