import Reveal from "./Reveal";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/data/projects";

export default function ProjectGrid({ projects, columns }: { projects: Project[]; columns?: number }) {
  return (
    <Reveal className="grid" style={columns ? { gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` } : undefined}>
      {projects.map((p) => (
        <ProjectCard key={p.slug} p={p} />
      ))}
    </Reveal>
  );
}
