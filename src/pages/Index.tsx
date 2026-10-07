// FILE PATH: src/pages/Index.tsx
// Place this file at: src/pages/Index.tsx

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import StatsSection from "../components/StatsSection";
import SectorsSection from "../components/SectorsSection";
import WhyChooseSection from "../components/WhyChooseSection";
import CTASection from "../components/CTASection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <StatsSection />
      <SectorsSection />
      <WhyChooseSection />  
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
