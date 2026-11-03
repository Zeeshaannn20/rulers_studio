import Reveal from "./Reveal";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/data/projects";

// Two modes:
// - projects: a plain 2 column grid (the "next films" strip on a film page)
// - rows: the Projects page. Each row is justified: every card gets width in proportion to its
//   film's shape, so all cards in a row share one height and vertical films keep their true 9:16.
export default function ProjectGrid({ projects, rows, columns }: { projects?: Project[]; rows?: Project[][]; columns?: number }) {
  if (rows) {
    // on phones vertical films sit two side by side; an odd one out goes full width
    const verticals = rows.flat().filter((p) => p.ratio < 1);
    const solo = verticals.length % 2 ? verticals[verticals.length - 1].slug : "";
    return (
      <Reveal className="pg">
        {rows.map((r, i) => (
          <div className={"pg-row" + (r.length === 1 ? " pg-one" : "")} key={i}>
            {r.map((p) => (
              <ProjectCard key={p.slug} p={p} fit solo={p.slug === solo} priority={i === 0} />
            ))}
          </div>
        ))}
      </Reveal>
    );
  }
  return (
    <Reveal className="grid" style={columns ? { gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` } : undefined}>
      {(projects ?? []).map((p) => (
        <ProjectCard key={p.slug} p={p} />
      ))}
    </Reveal>
  );
}
