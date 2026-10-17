import type { Metadata } from "next";
import Words from "@/components/Words";
import ProjectGrid from "@/components/ProjectGrid";
import ContactBlock from "@/components/ContactBlock";
import Footer from "@/components/Footer";
import { SORTED_PROJECTS } from "@/data/projects";
import JsonLd from "@/components/JsonLd";
import { OG_IMAGE, breadcrumbs, itemListSchema } from "@/data/seo";

export const metadata: Metadata = {
  title: "AI Ad Films & AI Video Portfolio",
  description:
    "Watch AI ad films and AI commercials by Rulers Studio, an AI video production company in Bengaluru. Concept films for Rolex, Amul, Snitch and more.",
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects", title: "AI Ad Films & AI Video Portfolio | Rulers Studio", images: [OG_IMAGE] },
};

// Projects: G-01 → PR-01 → PR-02 → G-03 → G-04
export default function ProjectsPage() {
  return (
    <>
      <JsonLd data={[itemListSchema(SORTED_PROJECTS), breadcrumbs([{ name: "Home", path: "/" }, { name: "Projects", path: "/projects" }])]} />
      <section className="wrap page-head">
        <span className="eyebrow">Selected work</span>
        <Words as="h1" className="h-xl" text="Projects" immediate />
        <p className="lede">AI ad films, product videos and micro dramas from our AI video production studio in Bengaluru.</p>
      </section>
      <section className="wrap" style={{ paddingBottom: "clamp(80px,10vw,140px)" }}>
        <ProjectGrid projects={SORTED_PROJECTS} />
      </section>
      <ContactBlock id="projects-contact" />
      <Footer />
    </>
  );
}
