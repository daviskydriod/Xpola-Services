// FILE PATH: src/data/countryData.ts
// Place this file at: src/data/countryData.ts

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  hero: {
    title: string;
    subtitle: string;
    cta1: string;
    cta2: string;
    cta3: string;
    trustBadges: {
      icon: string;
      label: string;
    }[];
  };
  about: {
    title: string;
    description: string;
    serveSectors: string[];
  };
  stats: {
    number: string;
    label: string;
    description: string;
    isNumeric: boolean;
    value: number;
  }[];
  sectors: {
    icon: string;
    title: string;
    description: string;
    link: string;
  }[];
  whyChoose: {
    title: string;
    subtitle: string;
    features: {
      icon: string;
      title: string;
      description: string;
    }[];
  };
  testimonials: {
    quote: string;
    name: string;
    title: string;
    company: string;
    rating: number;
  }[];
  contact: {
    email: string[];
    phone: string[];
    hours: string[];
    address: string;
  };
  footer: {
    tagline: string;
    compliance: string;
  };
}

export const countryData: Record<string, CountryData> = {
  nigeria: {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    hero: {
      title: "Integrated Sector Solutions for Nigeria's Growing Economy",
      subtitle: "Delivering consulting, oil & gas support, construction, trade, logistics, and digital commerce services across Nigeria and beyond.",
      cta1: "Explore Our Sectors",
      cta2: "Shop Online",
      cta3: "Request a Quote",
      trustBadges: [
        { icon: "FileCheck", label: "CAC Registered" },
        { icon: "Network", label: "Sector solutions" }
      ]
    },
    about: {
      title: "About Xpola Services Limited",
      description: "Xpola Services Limited is a duly registered Nigerian company with authority to engage in consulting, oil & gas support services, trading, contracting, manufacturing, logistics, and general commercial activities, in accordance with Nigerian laws and regulations.",
      serveSectors: [
        "Private sector businesses",
        "Government and public institutions",
        "NGOs and development organizations",
        "Oil & gas operators and contractors",
        "Individuals and households"
      ]
    },
    stats: [],
    sectors: [
      {
        icon: "Briefcase",
        title: "General Consulting",
        description: "Strategic business advisory, project management, and operational excellence consulting for Nigerian enterprises.",
        link: "/nigeria/services/consulting"
      },
      {
        icon: "Fuel",
        title: "Oil & Gas Support",
        description: "Comprehensive procurement, logistics coordination, and technical support for Nigeria's energy sector operations.",
        link: "/nigeria/services/oil-gas"
      },
      {
        icon: "Building",
        title: "Construction & Real Estate",
        description: "Project support, quality materials supply, and comprehensive property development services nationwide.",
        link: "/nigeria/services/construction"
      },
      {
        icon: "Mountain",
        title: "Mining & Quarrying",
        description: "Specialized support for extractive industries with reliable materials sourcing and operational logistics.",
        link: "/nigeria/services/mining"
      },
      {
        icon: "Globe",
        title: "General Commerce",
        description: "International trade facilitation, wholesale distribution, and cross-border supply chain management.",
        link: "/nigeria/services/commerce"
      },
      {
        icon: "ShoppingCart",
        title: "E-Commerce Platform",
        description: "Digital marketplace providing convenient access to industrial supplies, consumer goods, and business essentials.",
        link: "/nigeria/services/ecommerce"
      },
      {
        icon: "Truck",
        title: "Transportation & Logistics",
        description: "Reliable haulage, express delivery, and comprehensive coordination services across Nigeria.",
        link: "/nigeria/services/logistics"
      }
    ],
    whyChoose: {
      title: "Why Choose Xpola Nigeria",
      subtitle: "Trusted expertise, proven results, and unwavering commitment to excellence",
      features: [
        {
          icon: "Building2",
          title: "Fully CAC-Registered Nigerian Company",
          description: "Complete legal compliance with full corporate registration. We operate with transparency and accountability, meeting all Nigerian business regulations and standards."
        },
        {
          icon: "Fuel",
          title: "Oil & Gas Sector Ready",
          description: "Strategically positioned for participation in Nigeria's energy sector supply chain. Our structure and capabilities meet industry-specific requirements."
        },
        {
          icon: "Globe2",
          title: "Local Expertise, Global Standards",
          description: "Deep understanding of Nigerian markets combined with international best practices. We deliver world-class solutions tailored to local needs and opportunities."
        },
        {
          icon: "Layers",
          title: "Integrated Multi-Sector Approach",
          description: "Unified service delivery across all sectors. Our comprehensive model provides seamless solutions, from consulting to logistics, under one trusted partner."
        }
      ]
    },
    testimonials: [],
    contact: {
      email: ["info@xpolaservices.com", "xpolaservices@gmail.com"],
      phone: ["+234 708 627 5105", "Mon - Fri, 8AM - 6PM"],
      hours: ["Monday - Friday", "8:00 AM - 6:00 PM WAT"],
      address: "Lagos, Nigeria"
    },
    footer: {
      tagline: "Powering Growth Across Key Sectors",
      compliance: "Xpola Services Limited (Nigeria) operates in full compliance with Nigerian laws and regulations."
    }
  },
  canada: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    hero: {
      title: "Integrated Services Built for Performance",
      subtitle: "Delivering consulting, operational support, logistics, and commerce solutions across Canada.",
      cta1: "Explore Services",
      cta2: "Visit Marketplace",
      cta3: "Get Started",
      trustBadges: [
        { icon: "Shield", label: "Federally Registered" },
        { icon: "Network", label: "Professional services" }
      ]
    },
    about: {
      title: "About Xpola Services Canada",
      description: "Xpola Services Limited (Canada) supports organizations with professional services and integrated commerce, designed for efficiency, compliance, and scale.",
      serveSectors: [
        "Private sector organizations",
        "Public and government institutions",
        "Professional service providers",
        "Retail and wholesale enterprises",
        "Community and personal services"
      ]
    },
    stats: [],
    sectors: [
      {
        icon: "Briefcase",
        title: "Consulting & Advisory",
        description: "Management, administrative, and organizational consulting tailored for Canadian enterprises.",
        link: "/canada/services/consulting"
      },
      {
        icon: "Package",
        title: "Business & Operational Support",
        description: "Facilities management, coordinating, and business support services.",
        link: "/canada/services/operations"
      },
      {
        icon: "Truck",
        title: "Logistics & Distribution",
        description: "Warehousing, delivery, and supply chain coordination services.",
        link: "/canada/services/logistics"
      },
      {
        icon: "ShoppingBag",
        title: "Retail & Wholesale Trade",
        description: "General merchandise, direct selling, and wholesale supply.",
        link: "/canada/services/trade"
      },
      {
        icon: "Users",
        title: "Community & Personal Services",
        description: "Individual, family, and community-focused service solutions.",
        link: "/canada/services/community"
      }
    ],
    whyChoose: {
      title: "Why Choose Xpola Canada",
      subtitle: "Professional service delivery with Canadian excellence",
      features: [
        {
          icon: "MapPin",
          title: "Canada-wide Service Delivery",
          description: "Comprehensive coverage across all Canadian provinces. We understand regional requirements and deliver consistent quality nationwide."
        },
        {
          icon: "Building",
          title: "Public and Private Sector Experience",
          description: "Proven track record working with government and corporate clients. We navigate complex requirements with professionalism."
        },
        {
          icon: "Shield",
          title: "Compliance-Focused Operations",
          description: "Full adherence to federal and provincial regulations. Our operations are structured to meet the highest Canadian standards."
        },
        {
          icon: "Layers",
          title: "Integrated Service + Commerce Model",
          description: "Seamless blend of professional services and commercial supply. One partner for consulting, logistics, and procurement needs."
        }
      ]
    },
    testimonials: [],
    contact: {
      email: ["info@xpolaservices.com", "xpolaservices@gmail.com"],
      phone: ["+1 306 730 0639", "Mon - Fri, 9AM - 5PM"],
      hours: ["Monday - Friday", "9:00 AM - 5:00 PM ET"],
      address: "Toronto, Ontario, Canada"
    },
    footer: {
      tagline: "Professional services built for performance",
      compliance: "Xpola Services Limited (Canada) operates in full compliance with Canadian federal and provincial regulations."
    }
  }
};
