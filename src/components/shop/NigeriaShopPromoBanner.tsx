import { ArrowRight, MessageCircle, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import laptopExtender from "@/assets/New Images and Videos Update/laptop-screen-extender.webp";
import laptopExtenderThreeInOne from "@/assets/New Images and Videos Update/laptop-screen-extender-3-in-1.webp";

const NigeriaShopPromoBanner = () => (
  <section className="border-y border-gray-200 bg-white py-8 md:py-10" aria-labelledby="featured-products-title">
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-[#E02020]">Featured Nigeria products</p>
          <h2 id="featured-products-title" className="mt-2 font-montserrat text-2xl font-black tracking-tight text-gray-900 md:text-3xl">Upgrade your workspace</h2>
          <p className="mt-2 max-w-2xl font-poppins text-sm leading-6 text-gray-500">Laptop screen extenders selected for the Nigeria marketplace. Enquire now for availability and supply details.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="group grid overflow-hidden rounded-2xl border border-gray-200 bg-[#f8f8f8] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:grid-cols-[1.35fr_0.65fr]">
          <div className="flex min-h-[155px] items-center justify-center overflow-hidden bg-white">
            <img src={laptopExtender} alt="Laptop screen extender promotional product graphic" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" loading="lazy" />
          </div>
          <div className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#E02020]"><Monitor className="h-5 w-5" /></div>
              <h3 className="font-montserrat text-lg font-extrabold text-gray-900">Laptop screen extender</h3>
              <p className="mt-2 font-poppins text-xs leading-5 text-gray-500">Portable multi-screen productivity for work, study, and presentations.</p>
            </div>
            <Link to="/nigeria/contact" className="mt-5 inline-flex items-center gap-2 font-montserrat text-xs font-bold uppercase tracking-wider text-[#E02020] hover:gap-3">Enquire now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </article>

        <article className="group grid overflow-hidden rounded-2xl border border-gray-200 bg-[#f8f8f8] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:grid-cols-[1.35fr_0.65fr]">
          <div className="flex min-h-[155px] items-center justify-center overflow-hidden bg-white">
            <img src={laptopExtenderThreeInOne} alt="Three-in-one laptop screen extender promotional product graphic" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" loading="lazy" />
          </div>
          <div className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#E02020]"><Monitor className="h-5 w-5" /></div>
              <h3 className="font-montserrat text-lg font-extrabold text-gray-900">3-in-1 laptop extender</h3>
              <p className="mt-2 font-poppins text-xs leading-5 text-gray-500">A flexible extended-display setup for a more capable mobile workstation.</p>
            </div>
            <Link to="/nigeria/contact" className="mt-5 inline-flex items-center gap-2 font-montserrat text-xs font-bold uppercase tracking-wider text-[#E02020] hover:gap-3">Enquire now <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <MessageCircle className="h-4 w-4 text-[#E02020]" />
        <span>Need availability or business supply details?</span>
        <Link to="/nigeria/contact" className="font-bold text-[#E02020] hover:underline">Talk to Xpola Nigeria</Link>
      </div>
    </div>
  </section>
);

export default NigeriaShopPromoBanner;
