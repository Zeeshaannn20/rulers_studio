import type { Metadata } from "next";
import HeroStage from "@/components/HeroStage";
import WorkTree from "@/components/WorkTree";
import ServicesStage from "@/components/ServicesStage";
import Statement from "@/components/Statement";
import BrandMarquee from "@/components/BrandMarquee";
import Process from "@/components/Process";
import Faq from "@/components/Faq";
import ContactBlock from "@/components/ContactBlock";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { faqSchema, itemListSchema } from "@/data/seo";
import { HOME_PROJECTS } from "@/data/projects";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Home: opening stage + showreel → work tree → statement → services → process → FAQ → contact → footer
export default function Home() {
  return (
    <>
      <JsonLd data={[faqSchema(), itemListSchema(HOME_PROJECTS)]} />
      <HeroStage />
      <WorkTree />
      <Statement>
        <BrandMarquee />
      </Statement>
      <ServicesStage />
      <Process />
      <Faq />
      <ContactBlock id="home-contact" />
      <Footer />
    </>
  );
}
