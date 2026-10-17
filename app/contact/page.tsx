import type { Metadata } from "next";
import ContactBlock from "@/components/ContactBlock";
import Footer from "@/components/Footer";
import { OG_IMAGE } from "@/data/seo";

export const metadata: Metadata = {
  title: "Contact: Hire an AI Ad Film Studio",
  description:
    "Get a quote for an AI ad film, product video, UGC ads or a micro drama from Rulers Studio, Bengaluru. Tell us about your project and we reply within 24 hours.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contact Rulers Studio: AI Ad Film & AI Video Production", images: [OG_IMAGE] },
};

// Contact: G-01 → G-03 → G-04
export default function ContactPage() {
  return (
    <>
      <div style={{ height: "clamp(88px,10vw,120px)" }} />
      <ContactBlock id="contact" headingAs="h1" />
      <Footer />
    </>
  );
}
