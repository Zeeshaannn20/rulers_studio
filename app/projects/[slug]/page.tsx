import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TLink from "@/components/TLink";
import Player from "@/components/Player";
import ProjectGrid from "@/components/ProjectGrid";
import Footer from "@/components/Footer";
import { PAGE_PROJECTS, getProject, nextProjects } from "@/data/projects";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, projectDescription, projectLabel, videoSchema } from "@/data/seo";

// Only these projects get pages; any other slug is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return PAGE_PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getProject(params.slug);
  if (!p) return {};
  const title = projectLabel(p);
  const description = projectDescription(p);
  const url = `/projects/${p.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "video.other",
      url,
      title: `${title} | Rulers Studio`,
      description,
      images: p.coverImage ? [{ url: p.coverImage, alt: title }] : undefined,
      videos: p.videoUrl ? [{ url: p.videoUrl, type: "video/mp4" }] : undefined,
    },
    twitter: { card: "summary_large_image", title: `${title} | Rulers Studio`, description, images: p.coverImage ? [p.coverImage] : undefined },
  };
}

// Film page: a dark screening room — the film fills the screen, nothing competes with it.
export default function ProjectPage({ params }: { params: { slug: string } }) {
  const p = getProject(params.slug);
  if (!p) notFound();
  const next = nextProjects(p.slug);

  return (
    <>
      <JsonLd
        data={[
          videoSchema(p),
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: p.name, path: `/projects/${p.slug}` },
          ]),
        ]}
      />
      <section className="cinema">
        <div className="cinema-top">
          <TLink className="cinema-back" href="/projects">
            <span aria-hidden="true">←</span> All projects
          </TLink>
          <span className="cinema-tag">{p.typeTag}</span>
        </div>
        <div className={"cinema-screen" + (p.aspectRatio === "9:16" ? " vertical" : "")}>
          <Player p={p} />
        </div>
        <div className="cinema-cap">
          <h1>
            {p.name}
            <span className="sr-only">, {p.isConcept ? "concept " : ""}{p.typeTag}</span>
          </h1>
          <p>
            {p.typeTag}
            {p.industry ? ` · ${p.industry}` : ""}
            {p.isConcept === true ? " · Concept film" : ""}
          </p>
        </div>
      </section>

      {next.length > 0 && (
        <section className="wrap cinema-next">
          <span className="eyebrow">More films</span>
          <ProjectGrid projects={next} />
        </section>
      )}

      <Footer />
    </>
  );
}
