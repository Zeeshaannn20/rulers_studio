import type { Metadata } from "next";
import Words from "@/components/Words";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Terms of Use", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <>
      <section className="wrap page-head">
        <span className="eyebrow">Legal</span>
        <Words as="h1" className="h-l" text="Terms of Use" immediate />
      </section>
      <section className="wrap">
        <div className="legal">
          <p>Full terms to be supplied by Rulers Studio.</p>
          <p>Brand names shown in concept films belong to their owners; those films were not commissioned by them.</p>
        </div>
      </section>
      <Footer />
    </>
  );
}
