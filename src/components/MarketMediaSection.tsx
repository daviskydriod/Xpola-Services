import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";

import factoryWide from "@/assets/New Images and Videos Update/factory-floor-wide.jpeg";
import warehouseWide from "@/assets/New Images and Videos Update/warehouse-floor-stock.jpeg";
import inventoryView from "@/assets/New Images and Videos Update/warehouse-crates.jpeg";
import frontView from "@/assets/New Images and Videos Update/product-front-display.jpeg";
import frontAngle from "@/assets/New Images and Videos Update/product-side-angle.jpeg";
import topView from "@/assets/New Images and Videos Update/product-top-accessories.jpeg";
import accessoryView from "@/assets/New Images and Videos Update/product-top-cables.jpeg";
import rearView from "@/assets/New Images and Videos Update/product-rear-connections.jpeg";
import sideView from "@/assets/New Images and Videos Update/product-front-three-quarter.jpeg";
import sideViewTwo from "@/assets/New Images and Videos Update/product-side-profile.jpeg";
import productVideo from "@/assets/New Images and Videos Update/product-equipment-demo.mp4";

type MarketMedia = {
  title: string;
  description: string;
  bannerLabel: string;
  cta: string;
  imageAltPrefix: string;
};

const copy: Record<"NG" | "CA", MarketMedia> = {
  NG: {
    title: "Power and equipment solutions for Nigerian business",
    description: "Explore our latest equipment and supply capability for commercial, industrial, construction, and energy-related requirements across Nigeria.",
    bannerLabel: "Equipment and supply capability",
    cta: "Discuss a Nigeria requirement",
    imageAltPrefix: "Xpola equipment product view for Nigeria",
  },
  CA: {
    title: "Reliable equipment and operational supply support across Canada",
    description: "See the equipment range and fulfilment capability available for Canadian business, logistics, trade, and operational support enquiries.",
    bannerLabel: "Operational supply support",
    cta: "Discuss a Canada requirement",
    imageAltPrefix: "Xpola equipment product view for Canada",
  },
};

const gallery = [
  { src: frontView, label: "Front view" },
  { src: frontAngle, label: "Front three-quarter view" },
  { src: sideView, label: "Side view" },
  { src: sideViewTwo, label: "Side profile" },
  { src: topView, label: "Top and control view" },
  { src: accessoryView, label: "Accessory and connection view" },
  { src: rearView, label: "Rear connection view" },
  { src: inventoryView, label: "Warehouse inventory view" },
];

const MarketMediaSection = () => {
  const { currentData } = useCountry();
  const market = copy[currentData.code === "CA" ? "CA" : "NG"];
  const contactPath = currentData.code === "CA" ? "/canada/contact" : "/nigeria/contact";
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const closeLightbox = () => setSelectedIndex(null);
  const showPrevious = () => {
    setSelectedIndex((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length);
  };
  const showNext = () => {
    setSelectedIndex((current) => current === null ? null : (current + 1) % gallery.length);
  };

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  return (
    <section className="market-media-section py-20 md:py-28 bg-background-secondary" aria-labelledby="market-media-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-stretch">
          <div className="relative overflow-hidden rounded-3xl min-h-[320px] md:min-h-[430px] border border-border/30 shadow-2xl">
            <img src={factoryWide} alt={`${market.imageAltPrefix}, factory and warehouse overview`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="relative z-10 flex h-full min-h-[320px] md:min-h-[430px] flex-col justify-end p-6 md:p-10 text-white">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-300">{market.bannerLabel}</p>
              <h2 id="market-media-title" className="max-w-xl font-montserrat text-3xl font-extrabold leading-tight md:text-5xl">{market.title}</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">{market.description}</p>
              <Link to={contactPath} className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/80">
                {market.cta}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/30 bg-card shadow-xl">
            <div className="aspect-video bg-black">
              <video className="h-full w-full object-cover" controls muted loop playsInline preload="metadata" poster={warehouseWide}>
                <source src={productVideo} type="video/mp4" />
                Your browser does not support the equipment video. Please contact us for more information.
              </video>
            </div>
            <div className="p-6 md:p-8">
              <div className="mb-4 flex items-center gap-2 text-primary"><Images className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Product and fulfilment gallery</span></div>
              <h3 className="font-montserrat text-2xl font-bold text-foreground">See the equipment from every angle</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">The gallery shows product views, connection details, and warehouse context. Select any image to view it larger.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-5">
          {gallery.map((item, index) => (
            <button key={item.label} type="button" onClick={() => setSelectedIndex(index)} className="group overflow-hidden rounded-2xl border border-border/30 bg-card text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-secondary">
              <div className="aspect-square overflow-hidden bg-white p-3 md:p-5">
                <img src={item.src} alt={`${market.imageAltPrefix}, ${item.label.toLowerCase()}`} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <span className="block px-3 py-3 text-xs font-semibold text-foreground md:px-4">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${market.imageAltPrefix}, ${gallery[selectedIndex].label}`} onClick={closeLightbox}>
          <button type="button" onClick={closeLightbox} aria-label="Close image viewer" className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"><X className="h-6 w-6" /></button>
          <button type="button" onClick={(event) => { event.stopPropagation(); showPrevious(); }} aria-label="Previous image" className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 md:left-8"><ChevronLeft className="h-7 w-7" /></button>
          <figure className="max-h-[90vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img src={gallery[selectedIndex].src} alt={`${market.imageAltPrefix}, ${gallery[selectedIndex].label.toLowerCase()}`} className="max-h-[82vh] max-w-full rounded-xl object-contain" />
            <figcaption className="mt-3 text-center text-sm text-white/80">{gallery[selectedIndex].label}</figcaption>
          </figure>
          <button type="button" onClick={(event) => { event.stopPropagation(); showNext(); }} aria-label="Next image" className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 md:right-8"><ChevronRight className="h-7 w-7" /></button>
        </div>
      )}
    </section>
  );
};

export default MarketMediaSection;
