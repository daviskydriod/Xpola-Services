import { ArrowLeft, ArrowRight, CheckCircle, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export interface ServiceDetailCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ServiceDetailLayoutProps {
  backHref: string;
  backLabel?: string;
  countryLabel: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  servicesTitle: string;
  services: ServiceDetailCard[];
  listTitle: string;
  listItems: string[];
  secondListTitle?: string;
  secondListItems?: string[];
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
  ctaHref: string;
}

const ServiceDetailLayout = ({
  backHref,
  backLabel = "Back to Services",
  countryLabel,
  title,
  description,
  image,
  imageAlt,
  servicesTitle,
  services,
  listTitle,
  listItems,
  secondListTitle,
  secondListItems,
  ctaTitle,
  ctaDescription,
  ctaLabel,
  ctaHref,
}: ServiceDetailLayoutProps) => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <main>
      <section className="relative overflow-hidden border-b border-border bg-background-secondary pt-28 md:pt-32">
        <div className="container mx-auto grid items-center gap-10 px-4 pb-16 md:grid-cols-[1.05fr_.95fr] md:pb-20 lg:gap-16">
          <div className="order-2 md:order-1">
            <Link to={backHref} className="mb-7 inline-flex items-center gap-2 font-poppins text-sm font-semibold text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>
            <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.24em] text-primary">{countryLabel} · Xpola Services</p>
            <h1 className="max-w-3xl font-montserrat text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-6 max-w-2xl font-poppins text-lg leading-relaxed text-muted-foreground md:text-xl">{description}</p>
            <Link to={ctaHref} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-poppins text-sm font-bold text-white shadow-sm transition hover:bg-primary/90">
              {ctaLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-background shadow-xl">
              <img src={image} alt={imageAlt} className="h-64 w-full object-cover md:h-[390px]" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-primary/10" />
              <div className="absolute bottom-5 left-5 rounded-xl border border-white/20 bg-black/55 px-4 py-3 backdrop-blur-md">
                <p className="font-poppins text-xs font-semibold uppercase tracking-wider text-white/75">Service detail</p>
                <p className="mt-1 font-montserrat text-sm font-bold text-white">Practical support for your next step</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <p className="font-poppins text-xs font-bold uppercase tracking-[0.24em] text-primary">What we provide</p>
            <h2 className="mt-3 font-montserrat text-3xl font-bold text-foreground md:text-4xl">{servicesTitle}</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
            {services.map(({ icon: Icon, title: cardTitle, description: cardDescription }) => (
              <article key={cardTitle} className="group rounded-2xl border border-border bg-background-secondary p-6 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg md:p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-montserrat text-xl font-bold text-foreground">{cardTitle}</h3>
                <p className="mt-3 font-poppins leading-relaxed text-muted-foreground">{cardDescription}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background-secondary py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className={`mx-auto grid max-w-6xl gap-10 ${secondListTitle && secondListItems ? "lg:grid-cols-2" : "lg:grid-cols-[.8fr_1.2fr]"}`}>
            <div>
              <p className="font-poppins text-xs font-bold uppercase tracking-[0.24em] text-primary">Delivery focus</p>
              <h2 className="mt-3 font-montserrat text-3xl font-bold text-foreground">{listTitle}</h2>
              <div className="mt-7 space-y-4">
                {listItems.map(item => <div key={item} className="flex items-start gap-3"><CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p className="font-poppins leading-relaxed text-foreground">{item}</p></div>)}
              </div>
            </div>
            {secondListTitle && secondListItems && (
              <div>
                <p className="font-poppins text-xs font-bold uppercase tracking-[0.24em] text-primary">Built around your needs</p>
                <h2 className="mt-3 font-montserrat text-3xl font-bold text-foreground">{secondListTitle}</h2>
                <div className="mt-7 space-y-4">
                  {secondListItems.map(item => <div key={item} className="flex items-start gap-3"><CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p className="font-poppins leading-relaxed text-foreground">{item}</p></div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20">
        <div className="container mx-auto max-w-4xl rounded-3xl bg-primary px-6 py-12 text-center shadow-xl md:px-12 md:py-16">
          <p className="font-poppins text-xs font-bold uppercase tracking-[0.24em] text-white/70">Let’s work together</p>
          <h2 className="mt-3 font-montserrat text-3xl font-bold text-white md:text-4xl">{ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl font-poppins text-lg leading-relaxed text-white/80">{ctaDescription}</p>
          <Link to={ctaHref} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 font-poppins text-sm font-bold text-primary transition hover:bg-white/90">{ctaLabel} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default ServiceDetailLayout;
