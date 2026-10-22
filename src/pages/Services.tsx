// FILE PATH: src/pages/Services.tsx
// Place this file at: src/pages/Services.tsx

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SectorsSection from "../components/SectorsSection";
import WhyChooseSection from "../components/WhyChooseSection";
import CTASection from "../components/CTASection";
import MarketMediaSection from "../components/MarketMediaSection";
import { useCountry } from "../contexts/CountryContext";
import nigeriaHeroImage from "@/assets/stock-sources/service-construction.webp";
import canadaHeroImage from "@/assets/stock-sources/canada-goderich-industrial-port.webp";
import { usePageMeta } from "@/hooks/usePageMeta";

const Services = () => {
  const { currentData } = useCountry();
  const heroImage = currentData.code === "CA" ? canadaHeroImage : nigeriaHeroImage;
    usePageMeta(`Services in ${currentData.name} | Xpola Services`, `Explore Xpola Services consulting, logistics, commerce, and operational support services in ${currentData.name}.`);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="relative overflow-hidden border-b border-border bg-background-secondary pt-28 md:pt-32">
        <div className="container mx-auto grid items-center gap-10 px-4 pb-16 md:grid-cols-[1fr_.9fr] md:pb-20 lg:gap-16">
          <div>
            <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.24em] text-primary">{currentData.name} · Xpola Services</p>
            <h1 className="font-montserrat text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">Our Services</h1>
            <p className="mt-6 max-w-2xl font-poppins text-lg leading-relaxed text-muted-foreground md:text-xl">Comprehensive solutions tailored to meet your business needs across multiple sectors.</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
            <img src={heroImage} alt="Xpola Services working across sectors" width={752} height={1000} loading="eager" fetchPriority="high" decoding="async" className="h-80 w-full object-cover object-top md:h-[500px]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-primary/20" />
            <p className="absolute bottom-5 left-5 rounded-xl bg-black/55 px-4 py-3 font-poppins text-sm font-semibold text-white backdrop-blur-md">Practical support for your next step</p>
          </div>
        </div>
      </section>

      <SectorsSection />
      <MarketMediaSection />
      <WhyChooseSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Services;
