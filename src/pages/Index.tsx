// FILE PATH: src/pages/Index.tsx
// Place this file at: src/pages/Index.tsx

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import SectorsSection from "../components/SectorsSection";
import WhyChooseSection from "../components/WhyChooseSection";
import CTASection from "../components/CTASection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import { useCountry } from "../contexts/CountryContext";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  const { currentData } = useCountry();
  usePageMeta(`${currentData.name} Industrial & Commercial Solutions`, `Xpola Services provides consulting, logistics, commerce, and sector support solutions across ${currentData.name}.`);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SectorsSection />
      <WhyChooseSection />  
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
