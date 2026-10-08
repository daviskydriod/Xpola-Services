import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CTASection from '@/components/CTASection';
import { useCountry } from '@/contexts/CountryContext';
import { projectsApi, Project } from '@/lib/api';

const Projects = () => {
  const { selectedCountry } = useCountry();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    projectsApi.getPublic(selectedCountry === 'canada' ? 'CA' : 'NG')
      .then(r => setProjects(r.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [selectedCountry]);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background-secondary">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-montserrat font-extrabold text-4xl md:text-5xl text-foreground mb-5">Our Projects</h1>
          <p className="font-poppins text-lg text-muted-foreground max-w-2xl mx-auto">Verified project work and case studies from Xpola Services.</p>
        </div>
      </section>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {loading ? <p className="text-center text-muted-foreground">Loading projects…</p> : projects.length === 0 ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-10 text-center">
              <h2 className="font-montserrat font-bold text-xl text-foreground mb-3">Projects coming soon</h2>
              <p className="font-poppins text-sm text-muted-foreground">Verified project case studies will be published here after owner approval.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <article key={project.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  {project.image_url && <img src={project.image_url} alt={project.title} className="w-full h-52 object-cover" />}
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3 mb-3"><span className="text-xs font-bold uppercase tracking-widest text-primary">{project.sector || 'Project'}</span>{project.project_year && <span className="text-xs text-muted-foreground">{project.project_year}</span>}</div>
                    <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{project.title}</h2>
                    {project.client_name && <p className="text-xs text-muted-foreground mb-3">Client: {project.client_name}</p>}
                    <p className="font-poppins text-sm text-muted-foreground">{project.summary || project.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <CTASection />
      <Footer />
    </div>
  );
};
export default Projects;
