// FILE PATH: src/pages/About.tsx
// Place this file at: src/pages/About.tsx

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AboutSection from "../components/AboutSection";
import WhyChooseSection from "../components/WhyChooseSection";
import CTASection from "../components/CTASection";
import { useCountry } from "../contexts/CountryContext";

const About = () => {
  const { currentData } = useCountry();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background-secondary relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-montserrat font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
              About Xpola Services
            </h1>
            <p className="font-poppins text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Building sustainable solutions and empowering communities across {currentData.name}
            </p>
          </div>
        </div>
      </section>

      <AboutSection />
      <WhyChooseSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default About;
