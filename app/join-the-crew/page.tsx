import type { Metadata } from "next";
import Words from "@/components/Words";
import Reveal from "@/components/Reveal";
import TLink from "@/components/TLink";
import Footer from "@/components/Footer";
import { Arrow } from "@/components/Icons";
import { OPEN_ROLES } from "@/data/roles";
import { OG_IMAGE } from "@/data/seo";

export const metadata: Metadata = {
  title: "Careers: AI Director & AI Video Editor Jobs",
  description:
    "Rulers Studio, an AI film studio in Bengaluru, is hiring an AI Director, an Ad Alchemist and an AI Video Editor. Apply online with your CV and portfolio.",
  alternates: { canonical: "/join-the-crew" },
  openGraph: { url: "/join-the-crew", title: "Careers at Rulers Studio: AI Film Jobs in Bengaluru", images: [OG_IMAGE] },
};

// Join the Crew: G-01 → JC-01 → G-04
export default function CrewPage() {
  return (
    <>
      <section className="wrap page-head">
        <span className="eyebrow">Join the Crew · Now hiring</span>
        <Words as="h1" className="h-xl" text="Open roles" immediate />
      </section>
      <section className="wrap" style={{ paddingBottom: "clamp(80px,10vw,140px)" }}>
        <Reveal className="roles">
          {OPEN_ROLES.map((r, i) => (
            <TLink className="role" key={r.slug} href={`/join-the-crew/${r.slug}`} data-reveal="">
              <span className="num">({String(i + 1).padStart(2, "0")})</span>
              <div>
                <h3>{r.title}</h3>
                <p className="role-tag">{r.tagline}</p>
                <p>{r.summary}</p>
              </div>
              <span className="go">
                <Arrow />
              </span>
            </TLink>
          ))}
        </Reveal>
      </section>
      <Footer />
    </>
  );
}
