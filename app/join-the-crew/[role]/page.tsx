import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Words from "@/components/Words";
import TLink from "@/components/TLink";
import ApplyForm from "@/components/ApplyForm";
import Footer from "@/components/Footer";
import { ROLES, getRole } from "@/data/roles";
import JsonLd from "@/components/JsonLd";
import { OG_IMAGE, breadcrumbs, jobSchema } from "@/data/seo";

export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.slug }));
}

export function generateMetadata({ params }: { params: { role: string } }): Metadata {
  const r = getRole(params.role);
  if (!r) return {};
  const url = `/join-the-crew/${r.slug}`;
  const title = `${r.title} Job in Bengaluru at an AI Film Studio`;
  const description = `${r.title} job at Rulers Studio, an AI ad film studio in Bengaluru. ${r.tagline} Apply online with your CV and portfolio.`;
  return { title, description, alternates: { canonical: url }, openGraph: { url, title: `${title} | Rulers Studio`, description, images: [OG_IMAGE] } };
}

// Role detail: G-01 → RD-01 → RD-02 → RD-03 → RD-04 → G-04
export default function RolePage({ params }: { params: { role: string } }) {
  const r = getRole(params.role);
  if (!r) notFound();
  const list = (items: string[]) =>
    items.map((t) => <li key={t}>{t}</li>);

  return (
    <>
      <JsonLd
        data={[
          jobSchema(r),
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Join the Crew", path: "/join-the-crew" },
            { name: r.title, path: `/join-the-crew/${r.slug}` },
          ]),
        ]}
      />
      <section className="wrap page-head">
        <div className="crumb label">
          <TLink href="/join-the-crew">Join the Crew</TLink>
          <span>/</span>
          <b>{r.title}</b>
        </div>
        <Words as="h1" className="h-l" text={r.title} immediate />
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span className="pill">Now hiring</span>
          <p className="lede" style={{ margin: 0 }}>
            <em className="role-tag">{r.tagline}</em> {r.summary}
          </p>
        </div>
      </section>
      <section className="wrap rd">
        <div className="rd-copy" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div>
            <h3>What you&apos;ll do</h3>
            <ul>{list(r.responsibilities)}</ul>
          </div>
          <div>
            <h3>What we&apos;re looking for</h3>
            <ul>{list(r.requirements)}</ul>
          </div>
        </div>
        <ApplyForm role={r.slug} roleTitle={r.title} />
      </section>
      <Footer />
    </>
  );
}
