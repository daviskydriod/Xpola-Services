// FILE PATH: src/pages/Projects.tsx
// Retained for a future owner-approved relaunch; intentionally not routed publicly.

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CTASection from "../components/CTASection";
import { useCountry } from "../contexts/CountryContext";


const Projects = () => {
  const { currentData } = useCountry();

  // Public project figures and client case studies are withheld until the owner verifies them.
  const projects: never[] = [];
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
              Our Projects
            </h1>
            <p className="font-poppins text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Delivering excellence across diverse sectors with innovative solutions and sustainable practices
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background-secondary">
        <div className="container mx-auto px-4 text-center">
          <p className="font-poppins text-sm text-muted-foreground max-w-2xl mx-auto">
            Verified project figures and client case studies are being reviewed. Contact Xpola for relevant references and a current capability discussion.
          </p>
        </div>
      </section>
      {/* Projects Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-4">
              Featured Projects
            </h2>
            <p className="font-poppins text-lg text-muted-foreground">
              Showcasing our commitment to excellence and innovation
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-poppins text-muted-foreground">Verified project case studies will be published here after owner approval.</p>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};


export default Projects;
