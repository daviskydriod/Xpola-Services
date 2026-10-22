// FILE PATH: src/components/HeroSection.tsx
// Place this file at: src/components/HeroSection.tsx
import { ArrowRight, ShoppingBag, FileCheck, Calendar, Network, Shield } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import heroBackground from "@/assets/stock-sources/service-commerce.webp";

// Floating particles configuration
const particles = [
  { size: 5,  left: "88%", top: "8%",  opacity: 0.3,  delay: 0   },
  { size: 12, left: "90%", top: "5%",  opacity: 0.4,  delay: 0.5 },
  { size: 15, left: "24%", top: "2%",  opacity: 0.25, delay: 1   },
  { size: 8,  left: "12%", top: "50%", opacity: 0.3,  delay: 1.5 },
  { size: 10, left: "75%", top: "25%", opacity: 0.35, delay: 2   },
  { size: 7,  left: "46%", top: "18%", opacity: 0.3,  delay: 0.3 },
  { size: 13, left: "64%", top: "75%", opacity: 0.25, delay: 0.8 },
  { size: 11, left: "30%", top: "40%", opacity: 0.35, delay: 1.2 },
  { size: 9,  left: "87%", top: "60%", opacity: 0.3,  delay: 1.8 },
  { size: 6,  left: "18%", top: "85%", opacity: 0.3,  delay: 2.2 },
];

const iconMap: Record<string, any> = {
  FileCheck,
  Calendar,
  Network,
  Shield,
};

const HeroSection = () => {
  const { currentData } = useCountry();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [isVisible, setIsVisible]         = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ── Navigation handlers ────────────────────────────────────────────────────

  const scrollToSectors = () => {
    document.getElementById("sectors")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Shop Online button:
   * Reads the current country code from CountryContext and navigates
   * to the correct shop route — /nigeria/shop or /canada/shop.
   */
  const goToShop = () => {
    const shopPath = currentData.code === "NG" ? "/nigeria/shop" : "/canada/shop";
    navigate(shopPath);
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background Image with Parallax */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-700 ease-out"
        style={{
          transform: "scale(1.05)",
        }}
      >
        <img
          src={heroBackground}
          alt="African commerce and operations scene"
          className="h-full w-full object-cover"
          width={1800}
          height={1200}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{
            opacity: theme === "light" ? 0.15 : 0.25,
            filter:
              theme === "light"
                ? "brightness(1.2) contrast(0.9)"
                : "brightness(0.6) contrast(1.1)",
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            theme === "light"
              ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 50%, rgba(255,255,255,0.95) 100%)"
              : "linear-gradient(135deg, rgba(18,18,18,0.95) 0%, rgba(30,30,30,0.9) 50%, rgba(18,18,18,0.95) 100%)",
        }}
      />

      {/* Brand Glow 1 */}
      <div
        className="absolute w-[500px] h-[500px] z-[2] animate-pulse-slow"
        style={{
          left: "10%",
          top: "20%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Brand Glow 2 */}
      <div
        className="absolute w-[400px] h-[400px] z-[2] animate-pulse-slow"
        style={{
          right: "10%",
          bottom: "20%",
          background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          animationDelay: "1s",
        }}
      />

      {/* Floating Particles */}
            {particles.slice(0, 4).map((particle, index) => (
        <div
          key={index}
          className="absolute z-[3] animate-float"
          style={{
            width:           particle.size,
            height:          particle.size,
            left:            particle.left,
            top:             particle.top,
            opacity:         particle.opacity,
            background:      "hsl(var(--primary) / 0.4)",
            borderRadius:    "50%",
            animationDelay:  `${particle.delay}s`,
            animationDuration: `${4 + (index % 3)}s`,
            boxShadow:       "0 0 20px hsl(var(--primary) / 0.3)",
          }}
        />
      ))}

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-32 md:pt-40 pb-32">
        <div className="max-w-5xl mx-auto text-center">

          {/* Immediate headline render keeps the LCP stable. */}
          <h1
            className={`font-montserrat font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground mb-8 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ letterSpacing: "-0.5px", lineHeight: "1.3" }}
          >
            {currentData.hero.title}
          </h1>

          {/* Subtitle */}
          <p
            className={`font-poppins text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ lineHeight: "1.8" }}
          >
            {currentData.hero.subtitle}
          </p>

          {/* ── CTA Buttons ── */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-1000 delay-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            {/* Explore Our Services */}
            <button
              onClick={scrollToSectors}
              className="btn-primary group relative overflow-hidden transform hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-bounce-in"
              style={{ animationDelay: "0.8s" }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {currentData.hero.cta1}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2 duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </button>

            {/* ── Shop Online — navigates to /nigeria/shop or /canada/shop ── */}
            <button
              onClick={goToShop}
              className="btn-secondary group transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-bounce-in"
              style={{ animationDelay: "1s" }}
            >
              <span className="flex items-center gap-2">
                {currentData.hero.cta2}
                <ShoppingBag className="w-4 h-4 transition-transform group-hover:rotate-12 duration-300" />
              </span>
            </button>

            {/* Request a Quote */}
            <button
              onClick={scrollToContact}
              className="btn-secondary transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-bounce-in"
              style={{ animationDelay: "1.2s" }}
            >
              {currentData.hero.cta3}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {currentData.hero.trustBadges.map((badge, index) => {
              const Icon = iconMap[badge.icon];
              return (
                <div
                  key={index}
                  className={`trust-badge w-28 md:w-32 h-20 md:h-24 transform hover:scale-110 hover:-rotate-2 transition-all duration-300 cursor-pointer animate-scale-in ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  }`}
                  style={{
                    animationDelay:  `${1.4 + index * 0.15}s`,
                    transitionDelay: `${1.4 + index * 0.15}s`,
                  }}
                >
                  <Icon className="w-7 h-7 text-primary mb-2 animate-pulse" />
                  <span className="font-poppins font-semibold text-[10px] md:text-xs text-foreground uppercase tracking-wide text-center">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <div className="scroll-indicator w-6 h-10 flex justify-center pt-2 relative">
            <div className="scroll-indicator-dot w-1.5 h-3 animate-scroll-down" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 animate-pulse">Scroll Down</p>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0%   { opacity: 0; transform: scale(0.3) translateY(20px); }
          50%  { transform: scale(1.05); }
          70%  { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%      { opacity: 0.6; transform: scale(1) rotate(180deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes scroll-down {
          0%   { opacity: 0; transform: translateY(-10px); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(10px); }
        }
        .animate-blink       { animation: blink 1s step-end infinite; }
        .animate-slide-in-up { animation: slide-in-up 0.8s ease-out; }
        .animate-bounce-in   { animation: bounce-in 0.8s cubic-bezier(0.68,-0.55,0.265,1.55); animation-fill-mode: both; }
        .animate-scale-in    { animation: scale-in 0.6s ease-out; animation-fill-mode: both; }
        .animate-sparkle     { animation: sparkle 4s ease-in-out infinite; }
        .animate-pulse-slow  { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-scroll-down { animation: scroll-down 2s ease-in-out infinite; }
      `}</style>
    </section>
  );
};

export default HeroSection;
