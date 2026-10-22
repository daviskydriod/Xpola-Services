// FILE PATH: src/components/Footer.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import { useCountry } from "@/contexts/CountryContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";
import logoWhite from "@/assets/logo-white.webp";
import logoBlack from "@/assets/logo-black.webp";

const quickLinks = [
  { label: "About Us",    href: "/about" },
  { label: "Our Services",href: "/#sectors" },
  { label: "Shop",        href: "/shop" },
  { label: "Contact",     href: "/contact" },
];

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter,  href: "#", label: "Twitter" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram,href: "#", label: "Instagram" },
];

// FIXED: legal links use real routes
const legalLinks = [
  { label: "Privacy Policy",   to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Cookie Policy",    to: "/cookies" },
];

const Footer = () => {
  const { currentData } = useCountry();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || subscribing) return;
    setSubscribeError(""); setSubscribing(true);
    try {
      await apiFetch('/newsletter.php', { method: 'POST', body: JSON.stringify({ email, country: currentData.code }) });
      setSubscribed(true); setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) { setSubscribeError((err as Error).message || 'Subscription failed. Please try again.'); }
    finally { setSubscribing(false); }
  };

  const serviceLinks = currentData.sectors.map(sector => ({
    label: sector.title,
    href: sector.link,
  }));

  const currentLogo = theme === "dark" ? logoWhite : logoBlack;

  return (
    <footer className="bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          <div className="lg:col-span-1">
            <img src={currentLogo} alt="Xpola Services" width={1920} height={625} decoding="async" className="h-10 md:h-12 mb-5" />
            <p className="font-poppins text-sm text-muted-foreground mb-6 max-w-xs">
              {currentData.footer.tagline}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s, i) => (
                <a key={i} href={s.href} aria-label={s.label}
                  className="w-10 h-10 rounded-lg bg-background-secondary border border-border flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all">
                  <s.icon className="w-[18px] h-[18px] text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-montserrat font-bold text-base text-foreground mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="font-poppins text-sm text-muted-foreground hover:text-primary hover:pl-1 transition-all">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-montserrat font-bold text-base text-foreground mb-5">Our Services</h4>
            <ul className="space-y-3">
              {serviceLinks.slice(0, 7).map((link, i) => (
                <li key={i}>
                  <a href={link.href} className="font-poppins text-sm text-muted-foreground hover:text-primary hover:pl-1 transition-all">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-montserrat font-bold text-base text-foreground mb-5">Stay Updated</h4>
            <p className="font-poppins text-sm text-muted-foreground mb-4">
              Subscribe for industry insights and company updates
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email address" required
                className="w-full h-11 px-4 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors" />
              <button type="submit"
                className={`w-full h-11 font-poppins font-semibold text-sm rounded-lg transition-all hover:-translate-y-0.5 ${subscribed ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90"}`}>
                {subscribed ? "✓ Check your inbox" : subscribing ? "Subscribing…" : "Subscribe"}
              </button>
              {subscribeError && <p className="text-xs text-red-500" role="alert">{subscribeError}</p>}
              {subscribed && <p className="text-xs text-green-600" role="status">Thanks — your subscription was recorded.</p>}
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-poppins text-xs text-muted-foreground/60">
              © 2026 Xpola Services Limited ({currentData.name}). All Rights Reserved.
            </p>
            <div className="flex gap-6">
              {legalLinks.map((link, i) => (
                <Link key={i} to={link.to}
                  className="font-poppins text-xs text-muted-foreground hover:text-primary hover:underline transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="font-poppins text-[11px] text-muted-foreground/50 text-center mt-6">
            {currentData.footer.compliance}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
