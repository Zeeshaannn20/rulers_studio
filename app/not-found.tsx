import TLink from "@/components/TLink";
import Footer from "@/components/Footer";
import { Arrow } from "@/components/Icons";

export default function NotFound() {
  return (
    <>
      <section className="wrap not-found">
        <span className="eyebrow">404</span>
        <h1 className="h-xl">
          Cut
        </h1>
        <p className="lede">This page didn&apos;t make the final edit.</p>
        <TLink className="btn" href="/" style={{ alignSelf: "flex-start" }}>
          Back to home <Arrow />
        </TLink>
      </section>
      <Footer />
    </>
  );
}
