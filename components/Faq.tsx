"use client";
import { useState } from "react";
import Words from "./Words";
import Reveal from "./Reveal";
import { FAQS } from "@/data/seo";

// Home FAQ: the questions brands ask (and search for) before hiring an AI video studio.
export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="sec faq" aria-label="Frequently asked questions">
      <div className="wrap faq-grid">
        <div className="faq-head">
          <span className="eyebrow">FAQ</span>
          <Words className="h-l" text="Questions brands ask us" />
          <p className="lede">Everything you need to know about AI ad films and AI video production.</p>
        </div>
        <Reveal className="acc">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div className={"acc-row" + (isOpen ? " open" : "")} key={f.q} data-reveal="">
                <h3 className="faq-q">
                  <button type="button" className="acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                    <span className="acc-no">{String(i + 1).padStart(2, "0")}</span>
                    <span className="acc-title">{f.q}</span>
                    <span className="acc-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div className="acc-body">
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
