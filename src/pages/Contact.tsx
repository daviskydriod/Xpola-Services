// FILE PATH: src/pages/Contact.tsx
// Place this file at: src/pages/Contact.tsx

import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactSection from "../components/ContactSection";
import { useCountry } from "../contexts/CountryContext";
import { contactApi } from "../lib/api";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import heroImage from "@/assets/logistics.jpg";

interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

const initialForm: ContactFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  service: "",
  message: "",
};

const Contact = () => {
  const { currentData } = useCountry();
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      await contactApi.submit(form);
      setStatus("sent");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b border-border bg-background-secondary pt-28 md:pt-32">
        <div className="container mx-auto grid items-center gap-10 px-4 pb-16 md:grid-cols-[1fr_.9fr] md:pb-20 lg:gap-16">
          <div>
            <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.24em] text-primary">Start a conversation · {currentData.name}</p>
            <h1 className="font-montserrat text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">Get in Touch</h1>
            <p className="mt-6 max-w-2xl font-poppins text-lg leading-relaxed text-muted-foreground md:text-xl">Have a question or ready to start a project? Tell us what you need and our team will help you define the next step.</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-xl">
            <img src={heroImage} alt="Xpola Services logistics and delivery support" className="h-64 w-full object-cover md:h-80" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-primary/20" />
            <p className="absolute bottom-5 left-5 rounded-xl bg-black/55 px-4 py-3 font-poppins text-sm font-semibold text-white backdrop-blur-md">Let’s discuss your requirement</p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
                <h2 className="font-montserrat font-bold text-2xl text-foreground mb-6">
                  Send us a Message
                </h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-poppins text-sm font-medium text-foreground mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block font-poppins text-sm font-medium text-foreground mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={form.lastName}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-poppins text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label className="block font-poppins text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block font-poppins text-sm font-medium text-foreground mb-2">
                      Service Interest
                    </label>
                    <select
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">Select a service</option>
                      {currentData.sectors.map((sector, index) => (
                        <option key={index} value={sector.title}>
                          {sector.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-poppins text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg font-poppins text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project or inquiry..."
                    />
                  </div>

                  {status === "sent" && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <span className="text-green-600">✓</span>
                      <p className="font-poppins text-sm text-green-700">
                        Message sent! We'll be in touch within 24 hours.
                      </p>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <span className="text-red-600">!</span>
                      <p className="font-poppins text-sm text-red-700">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full h-12 bg-primary text-white font-poppins font-semibold text-sm rounded-lg border-2 border-primary transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {status === "sending" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-8">
                  <h3 className="font-montserrat font-bold text-xl text-foreground mb-6">
                    Contact Information
                  </h3>
                  <div className="space-y-6">
                    <ContactInfoItem
                      icon={Mail}
                      label="Email"
                      items={currentData.contact.email}
                    />
                    <ContactInfoItem
                      icon={Phone}
                      label="Phone"
                      items={currentData.contact.phone}
                    />
                    <ContactInfoItem
                      icon={Clock}
                      label="Office Hours"
                      items={currentData.contact.hours}
                    />
                    <ContactInfoItem
                      icon={MapPin}
                      label="Location"
                      items={[currentData.name]}
                    />
                  </div>
                </div>

                {/* Additional Info Card */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-8">
                  <h3 className="font-montserrat font-bold text-lg text-foreground mb-3">
                    Quick Response Guarantee
                  </h3>
                  <p className="font-poppins text-sm text-muted-foreground mb-4">
                    We typically respond to all inquiries within 24 hours during business days.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="font-poppins text-sm text-foreground">
                        Free initial consultation
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="font-poppins text-sm text-foreground">
                        Customized solutions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="font-poppins text-sm text-foreground">
                        Expert guidance
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </div>
  );
};

interface ContactInfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  items: string[];
}

const ContactInfoItem = ({ icon: Icon, label, items }: ContactInfoItemProps) => {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="icon-container">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div>
        <h4 className="font-montserrat font-semibold text-sm text-foreground mb-2">
          {label}
        </h4>
        <div className="space-y-1">
          {items.map((item, index) => (
            <p key={index} className="font-poppins text-sm text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
