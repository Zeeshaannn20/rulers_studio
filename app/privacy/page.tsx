import type { Metadata } from "next";
import Words from "@/components/Words";
import Footer from "@/components/Footer";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <>
      <section className="wrap page-head">
        <span className="eyebrow">Legal</span>
        <Words as="h1" className="h-l" text="Privacy Policy" immediate />
      </section>
      <section className="wrap">
        <div className="legal">
          <p>Full privacy policy to be supplied by Rulers Studio.</p>
          <p>Brand names shown in concept films belong to their owners; those films were not commissioned by them.</p>
        </div>
      </section>
      <Footer />
    </>
  );
}
