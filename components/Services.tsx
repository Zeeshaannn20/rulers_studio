"use client";
import { useState } from "react";
import Words from "./Words";
import TLink from "./TLink";
import Reveal from "./Reveal";
import { Arrow } from "./Icons";
import { SERVICES } from "@/data/site";

// H-03: services as an accordion inside a dark rounded panel. One row open at a time.
export default function Services() {
  const [open, setOpen] = useState(0);
  return (
    <section className="sec">
      <div className="panel svc">
        <div className="in">
        <div className="svc-grid">
          <span className="eyebrow">What we do</span>
          <div>
            <Words className="h-xl" text="Services" />
            <p className="lede svc-lede">Real production thinking at AI speed.</p>
          </div>
        </div>

        <Reveal className="acc">
          {SERVICES.map((s, i) => {
            const isOpen = open === i;
            return (
              <div className={"acc-row" + (isOpen ? " open" : "")} key={s.no} data-reveal="">
                <button type="button" className="acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="acc-no">{s.no}</span>
                  <span className="acc-title">{s.title}</span>
                  <span className="acc-icon" aria-hidden="true" />
                </button>
                <div className="acc-body">
                  <div>
                    <p>{s.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>

        <div className="svc-cta">
          <TLink className="btn light" href="/contact">
            Get started <Arrow />
          </TLink>
        </div>
        </div>
      </div>
    </section>
  );
}
