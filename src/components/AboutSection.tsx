import { useCountry } from "@/contexts/CountryContext";
import { useTheme } from "@/contexts/ThemeContext";
import nigeriaBackground from "@/assets/stock-sources/service-consulting.webp";
import canadaBackground from "@/assets/stock-sources/canada-office-building.webp";

const AboutSection = () => {
  const { currentData } = useCountry();
  const { theme } = useTheme();
  const heroBackground = currentData.code === 'CA' ? canadaBackground : nigeriaBackground;

  return (
    <section id="about" className="relative py-16 md:py-20 overflow-hidden bg-background">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBackground}
          alt="Background"
          width={667}
          height={1000}
          decoding="async"
          className="h-full w-full object-cover"
          style={{
            opacity: theme === 'light' ? 0.08 : 0.15,
            filter: theme === 'light' ? 'brightness(1.1) contrast(0.9)' : 'brightness(0.5) contrast(1.1)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: theme === 'light'
              ? "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(18, 18, 18, 0.95) 0%, rgba(30, 30, 30, 0.92) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-foreground mb-3">
            {currentData.about.title}
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Who We Are & We Serve */}
          <div>
            {/* Who We Are */}
            <div className="mb-8">
              <h3 className="font-montserrat font-bold text-2xl md:text-3xl text-foreground mb-4">
                Who We Are
              </h3>
              <p className="font-poppins text-base md:text-lg text-muted-foreground leading-relaxed">
                {currentData.about.description}
              </p>
            </div>

            {/* We Serve */}
            <div>
              <h3 className="font-montserrat font-bold text-2xl md:text-3xl text-foreground mb-4">
                We Serve
              </h3>
              <div className="space-y-3">
                {currentData.about.serveSectors.map((sector, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background-secondary border border-border hover:border-primary transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <p className="font-poppins text-sm md:text-base text-foreground">
                      {sector}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border">
              <img
                src={heroBackground}
                alt="Business operations"
                width={667}
                height={1000}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={{
                  minHeight: "400px",
                  maxHeight: "600px",
                  filter: theme === 'light' ? 'brightness(0.95)' : 'brightness(0.7)',
                }}
              />
              <div 
                className="absolute inset-0"
                style={{
                  background: theme === 'light'
                    ? "linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)"
                    : "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%)",
                }}
              ></div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements - Using Brand Colors */}
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          top: "10%",
          right: "10%",
          opacity: theme === 'light' ? 0.5 : 0.3,
        }}
      ></div>
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          bottom: "10%",
          left: "10%",
          opacity: theme === 'light' ? 0.5 : 0.3,
        }}
      ></div>
    </section>
  );
};

export default AboutSection;
