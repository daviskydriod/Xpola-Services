import oilGasImg from "@/assets/oil-gas.webp";
import constructionImg from "@/assets/construction.webp";
import ecommerceImg from "@/assets/ecommerce.webp";
import miningImg from "@/assets/mining.webp";
import logisticsImg from "@/assets/logistics.webp";
import consultingImg from "@/assets/consulting.webp";

interface Project {
  category: string;
  title: string;
  description: string;
  image: string;
}

const projects: Project[] = [
  {
    category: "OIL & GAS",
    title: "Energy Sector Procurement",
    description: "Logistics support for major oil field operations",
    image: oilGasImg,
  },
  {
    category: "CONSTRUCTION",
    title: "Abuja Commercial Complex",
    description: "Materials supply for 12-story development",
    image: constructionImg,
  },
  {
    category: "E-COMMERCE",
    title: "Digital Marketplace Launch",
    description: "Platform connecting suppliers and buyers",
    image: ecommerceImg,
  },
  {
    category: "MINING",
    title: "Mining Operations Support",
    description: "Equipment and materials for extraction projects",
    image: miningImg,
  },
  {
    category: "LOGISTICS",
    title: "Nationwide Distribution",
    description: "Multi-state transportation coordination",
    image: logisticsImg,
  },
  {
    category: "CONSULTING",
    title: "Enterprise Strategy Advisory",
    description: "Growth consulting for manufacturing sector",
    image: consultingImg,
  },
];

const PortfolioSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Recent Projects
          </h2>
          <p className="font-poppins text-lg text-muted-foreground">
            Delivering excellence across sectors
          </p>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={index} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <div className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {/* Background Image */}
      <img
        src={project.image}
        alt={project.title}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
        style={{
          filter: "brightness(0.6) contrast(1.05)",
        }}
      />

      {/* Gradient Overlay */}
      <div className="project-overlay absolute inset-0 pointer-events-none" />

      {/* Category Badge */}
      <div className="absolute top-5 left-5 z-10">
        <span className="category-badge text-foreground">
          {project.category}
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-7 z-10">
        <h3 className="font-montserrat font-bold text-xl text-foreground mb-2">
          {project.title}
        </h3>
        <p className="font-poppins text-sm text-muted-foreground">
          {project.description}
        </p>
      </div>
    </div>
  );
};

export default PortfolioSection;
