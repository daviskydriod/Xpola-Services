import { ArrowUpRight, Cpu, Images } from "lucide-react";
import { Link } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";

import frontClean from "@/assets/New Images and Videos Update/product-front-clean.webp";
import frontDisplay from "@/assets/New Images and Videos Update/product-front-display.webp";
import frontThreeQuarter from "@/assets/New Images and Videos Update/product-front-three-quarter.webp";
import sideClean from "@/assets/New Images and Videos Update/product-side-clean.webp";
import controlPanel from "@/assets/New Images and Videos Update/product-control-panel.webp";
import rearConnections from "@/assets/New Images and Videos Update/product-rear-connections.webp";

const showcaseItems = [
  { image: frontClean, title: "Professional equipment range", description: "Clean front profile for a quick product overview." },
  { image: frontDisplay, title: "Front display detail", description: "A closer look at the equipment face and working layout." },
  { image: frontThreeQuarter, title: "Three-quarter profile", description: "See the build, proportions, and overall form." },
  { image: sideClean, title: "Side profile", description: "Side view for fit, placement, and installation planning." },
  { image: controlPanel, title: "Control and connection detail", description: "Inspect the control area before discussing requirements." },
  { image: rearConnections, title: "Rear connections", description: "Review the rear interface and connection points." },
];

const ShopElectronicsShowcase = () => {
  const { currentData } = useCountry();
  const market = currentData.code === "CA" ? "Canada" : "Nigeria";
  const contactPath = currentData.code === "CA" ? "/canada/contact" : "/nigeria/contact";

  return (
    <section className="border-y border-gray-200 bg-[#f7f7f7] py-10 md:py-14" aria-labelledby="electronics-showcase-title">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[#E02020]">
              <Cpu className="h-5 w-5" />
              <p className="font-montserrat text-[11px] font-bold uppercase tracking-[0.2em]">Equipment showcase</p>
            </div>
            <h2 id="electronics-showcase-title" className="font-montserrat text-2xl font-black tracking-tight text-gray-900 md:text-3xl">
              Explore the electronics range
            </h2>
            <p className="mt-2 max-w-2xl font-poppins text-sm leading-6 text-gray-500">
              Review product views and connection details before requesting availability for your {market} requirement.
            </p>
          </div>
          <Link to={contactPath} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#E02020] px-4 py-2.5 font-montserrat text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#c01a1a]">
            Request details
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-6">
          {showcaseItems.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-white p-3 md:p-4">
                <img src={item.image} alt={item.title} className="h-full w-full object-contain transition duration-500 hover:scale-105" loading="lazy" />
              </div>
              <div className="border-t border-gray-100 p-3 md:p-4">
                <div className="mb-2 flex items-center gap-1.5 text-[#E02020]"><Images className="h-3.5 w-3.5" /><span className="font-montserrat text-[10px] font-bold uppercase tracking-wider">Product view</span></div>
                <h3 className="font-montserrat text-sm font-extrabold leading-5 text-gray-900">{item.title}</h3>
                <p className="mt-1.5 font-poppins text-xs leading-5 text-gray-500">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopElectronicsShowcase;
