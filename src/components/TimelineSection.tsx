// FILE PATH: src/components/common/TimelineSection.tsx
// Place this file at: src/components/common/TimelineSection.tsx

import { Building2, Users, Award, TrendingUp, Globe, Zap } from "lucide-react";

const milestones = [
  {
    year: "2015",
    title: "Company Founded",
    description: "Xpola Services was established in Nigeria with a vision to transform industries",
    icon: Building2,
  },
  {
    year: "2017",
    title: "First Major Project",
    description: "Project history available on request; value to be verified",
    icon: Award,
  },
  {
    year: "2019",
    title: "Team Expansion",
    description: "Team and sector history to be confirmed by the owner",
    icon: Users,
  },
  {
    year: "2021",
    title: "International Growth",
    description: "Expanded operations to Canada, establishing North American presence",
    icon: Globe,
  },
  {
    year: "2023",
    title: "Digital Transformation",
    description: "Launched e-commerce and digital logistics platforms across both markets",
    icon: Zap,
  },
  {
    year: "2024",
    title: "Sustainable Future",
    description: "Sustainability and project-value figures to be verified before publication",
    icon: TrendingUp,
  },
];

const TimelineSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="section-divider mb-16" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Our Journey
          </h2>
          <p className="font-poppins text-lg text-muted-foreground max-w-2xl mx-auto">
            A decade of growth, innovation, and delivering excellence
          </p>
        </div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-border transform -translate-x-1/2" />

            {/* Timeline Items */}
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <TimelineItem
                  key={index}
                  milestone={milestone}
                  isRight={index % 2 === 1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface TimelineItemProps {
  milestone: {
    year: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  isRight: boolean;
}

const TimelineItem = ({ milestone, isRight }: TimelineItemProps) => {
  const Icon = milestone.icon;

  return (
    <div
      className={`relative flex items-center ${
        isRight ? "md:flex-row-reverse" : "md:flex-row"
      } flex-col md:gap-8`}
    >
      {/* Content Card */}
      <div
        className={`w-full md:w-5/12 ${
          isRight ? "md:text-right" : "md:text-left"
        } text-left`}
      >
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1 hover:shadow-xl">
          {/* Year Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4`}
          >
            <span className="font-montserrat font-bold text-sm text-primary">
              {milestone.year}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-montserrat font-bold text-xl text-foreground mb-3">
            {milestone.title}
          </h3>

          {/* Description */}
          <p className="font-poppins text-sm text-muted-foreground leading-relaxed">
            {milestone.description}
          </p>
        </div>
      </div>

      {/* Center Icon */}
      <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-16 h-16 bg-card border-4 border-primary rounded-full items-center justify-center z-10 shadow-lg">
        <Icon className="w-7 h-7 text-primary" />
      </div>

      {/* Mobile Icon */}
      <div className="md:hidden flex w-12 h-12 bg-card border-2 border-primary rounded-full items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>

      {/* Spacer for alignment */}
      <div className="hidden md:block w-5/12" />
    </div>
  );
};

export default TimelineSection;
