import type { Metadata } from "next";
import ContactBlock from "@/components/ContactBlock";
import Footer from "@/components/Footer";
import { OG_IMAGE } from "@/data/seo";

export const metadata: Metadata = {
  title: "Contact: Hire an AI Ad Film Studio",
  description:
    "Get a quote for AI ad creatives, product videos, brand stories or UGC ads from Rulers Studio. We work with brands worldwide. Tell us about your project.",
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
