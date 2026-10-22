import { ArrowRight, Briefcase, Fuel, Building, Mountain, Globe, ShoppingCart, Truck, Package, ShoppingBag, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useCountry } from "@/contexts/CountryContext";
import { useTheme } from "@/contexts/ThemeContext";
import consultingImg from "@/assets/consulting.webp";
import oilGasImg from "@/assets/oil-gas.webp";
import constructionImg from "@/assets/construction.webp";
import miningImg from "@/assets/mining.webp";
import commerceImg from "@/assets/commerce.webp";
import ecommerceImg from "@/assets/ecommerce.webp";
import logisticsImg from "@/assets/logistics.webp";

const iconMap: Record<string, any> = {
  Briefcase,
  Fuel,
  Building,
  Mountain,
  Globe,
  ShoppingCart,
  Truck,
  Package,
  ShoppingBag,
  Users,
};

const imageMap: Record<string, string> = {
  consulting: consultingImg,
  'oil-gas': oilGasImg,
  construction: constructionImg,
  mining: miningImg,
  commerce: commerceImg,
  ecommerce: ecommerceImg,
  logistics: logisticsImg,
  operations: constructionImg,
  trade: commerceImg,
  community: consultingImg,
};

const SectorsSection = () => {
  const { currentData } = useCountry();

  const getImage = (link: string) => {
    const key = link.split('/').pop() || '';
    return imageMap[key] || consultingImg;
  };

  const firstRow = currentData.sectors.slice(0, 4);
  const secondRow = currentData.sectors.slice(4);

  return (
    <section id="sectors" className="py-20 bg-background-secondary">
      <div className="section-divider mb-16"></div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
            Our Core Sectors
          </h2>
          <p className="font-poppins text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive solutions across key industries, delivered with expertise and local insight
          </p>
        </div>

        {firstRow.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {firstRow.map((sector, index) => (
              <SectorCard key={index} sector={sector} index={index} getImage={getImage} />
            ))}
          </div>
        )}

        {secondRow.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:max-w-4xl mx-auto">
            {secondRow.map((sector, index) => (
              <SectorCard key={index + firstRow.length} sector={sector} index={index + firstRow.length} getImage={getImage} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface SectorCardProps {
  sector: {
    icon: string;
    title: string;
    description: string;
    link: string;
  };
  index: number;
  getImage: (link: string) => string;
}

const SectorCard = ({ sector, index, getImage }: SectorCardProps) => {
  const { theme } = useTheme();
  const Icon = iconMap[sector.icon];

  return (
    <div
      className="group relative bg-card border border-border rounded-2xl overflow-hidden transition-all duration-400 hover:border-primary hover:-translate-y-2 hover:shadow-xl"
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImage(sector.link)}
          alt={sector.title}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          style={{ 
            filter: theme === 'light' 
              ? 'brightness(0.9) contrast(1.05)' 
              : 'brightness(0.7) contrast(1.1)',
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ 
            background: theme === 'light'
              ? 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.95) 100%)'
              : 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.8) 100%)',
            opacity: theme === 'light' ? 0.7 : 0.9,
          }}
        ></div>
      </div>

      <div className="absolute left-6 top-40 z-10 w-16 h-16 bg-background border-2 border-primary rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
        {Icon && <Icon className="w-8 h-8 text-primary" />}
      </div>

      <div className="pt-12 pb-16 px-6 bg-card">
        <h3 className="font-montserrat font-bold text-xl md:text-[22px] text-foreground mb-3 leading-tight min-h-[56px]">
          {sector.title}
        </h3>
        <p className="font-poppins text-[15px] text-muted-foreground leading-relaxed line-clamp-4">
          {sector.description}
        </p>
      </div>

      <Link
        to={sector.link}
        className="absolute bottom-6 left-6 font-poppins font-semibold text-sm text-primary flex items-center gap-2 transition-all duration-300 hover:gap-3"
      >
        Learn More
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default SectorsSection;
