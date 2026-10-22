import { ArrowRight, Clock3, MessageCircle, Monitor, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import laptopExtender from "@/assets/New Images and Videos Update/laptop-screen-extender.webp";
import laptopExtenderThreeInOne from "@/assets/New Images and Videos Update/laptop-screen-extender-3-in-1.webp";

const promos = [
  {
    image: laptopExtender,
    name: "Laptop screen extender",
    description: "Portable multi-screen productivity for work, study, and presentations.",
    alt: "Laptop screen extender promotional product graphic",
  },
  {
    image: laptopExtenderThreeInOne,
    name: "3-in-1 laptop screen extender",
    description: "A flexible extended-display setup for a more capable mobile workstation.",
    alt: "Three-in-one laptop screen extender promotional product graphic",
  },
];

const NigeriaShopPromoBanner = () => (
  <section className="border-y border-[#ead7d7] bg-[#fff8f8] py-5 md:py-7" aria-labelledby="approved-products-title">
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-8">
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_3px_18px_rgba(80,0,0,0.08)]">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-[#b9111b] via-[#e02020] to-[#ff4b43] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15"><ShoppingBag className="h-5 w-5" /></div>
            <div>
              <p className="font-montserrat text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-100">Featured products</p>
              <h2 id="approved-products-title" className="mt-0.5 font-montserrat text-xl font-black md:text-2xl">Upgrade your workspace</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/15 px-3 py-2 text-xs font-bold"><Clock3 className="h-4 w-4" /> Coming soon to the Nigeria shop</div>
        </div>

        <div className="border-b border-gray-100 px-4 py-3 md:px-6">
          <p className="font-poppins text-xs leading-5 text-gray-500">Owner-approved laptop screen extenders selected for the Nigeria marketplace. Enquire now while online listing is being prepared.</p>
        </div>

        <div className="flex snap-x gap-4 overflow-x-auto p-4 md:grid md:grid-cols-2 md:overflow-visible md:p-5">
          {promos.map((promo) => (
            <article key={promo.name} className="group min-w-[300px] snap-start overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[#e02020]/40 hover:shadow-md md:min-w-0">
              <div className="relative aspect-[2/1] overflow-hidden bg-gray-50">
                <img src={promo.image} alt={promo.alt} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-sm bg-[#e02020] px-2 py-1 font-montserrat text-[10px] font-extrabold uppercase tracking-wide text-white">Approved product</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#e02020]"><Monitor className="h-4 w-4" /><span className="font-poppins text-[10px] font-bold uppercase tracking-wider">Computer accessories</span></div>
                    <h3 className="mt-1 font-montserrat text-base font-extrabold text-gray-900">{promo.name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 font-poppins text-[10px] font-bold text-[#e02020]">Soon</span>
                </div>
                <p className="mt-2 line-clamp-2 font-poppins text-xs leading-5 text-gray-500">{promo.description}</p>
                <Link to="/nigeria/contact" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#e02020] px-4 py-2.5 font-montserrat text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#b9111b]">Enquire now <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 font-poppins text-xs text-gray-500"><MessageCircle className="h-4 w-4 text-[#e02020]" /><span>Need availability or business supply details?</span></div>
          <Link to="/nigeria/contact" className="font-montserrat text-xs font-bold uppercase tracking-wider text-[#e02020] hover:underline">Talk to Xpola Nigeria →</Link>
        </div>
      </div>
    </div>
  </section>
);

export default NigeriaShopPromoBanner;
