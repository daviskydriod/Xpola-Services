// FILE PATH: src/pages/Services.tsx
// Place this file at: src/pages/Services.tsx

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SectorsSection from "../components/SectorsSection";
import WhyChooseSection from "../components/WhyChooseSection";
import CTASection from "../components/CTASection";
import { useCountry } from "../contexts/CountryContext";
import heroImage from "@/assets/hero-bg.jpg";

const Services = () => {
  const { currentData } = useCountry();

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
            <img src={heroImage} alt="Xpola Services working across sectors" className="h-64 w-full object-cover md:h-80" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-primary/20" />
            <p className="absolute bottom-5 left-5 rounded-xl bg-black/55 px-4 py-3 font-poppins text-sm font-semibold text-white backdrop-blur-md">Practical support for your next step</p>
          </div>
        </div>
      </section>

      <SectorsSection />
      <WhyChooseSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Services;
