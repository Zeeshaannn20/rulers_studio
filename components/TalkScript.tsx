"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// The screenplay picks up again on the "Book a call" card. It types itself once when the card
// comes into view (about 2.2 s). Only the text animates; the "Book a call" button stays put the whole time.
// The full text is in the HTML from the start, so search engines and no-JS visitors see it all.
const LINES: [string, string][] = [
  ["sh", "INT. YOUR OFFICE. DAY."],
  ["ch", "YOU"],
  ["dl", "I have an idea."],
  ["ch", "RULERS STUDIO"],
  ["dl", "Let’s hear it."],
];
const PER_CHAR = 23; // ms per letter
const AFTER_LINE = 220; // pause after a line
const AFTER_NAME = 90; // shorter pause after a character name

export default function TalkScript() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    const card = el?.closest<HTMLElement>(".talk");
    if (!el || !card || prefersReducedMotion()) return;
    const rows = Array.from(el.children) as HTMLElement[];
    // arm: empty the lines (the button is never hidden)
    el.style.minHeight = el.offsetHeight + "px";
    rows.forEach((r) => (r.textContent = ""));
    card.classList.add("tk-wait");
    let timer = 0;
    let done = false;

    const play = () => {
      let i = 0;
      let k = 0;
      const step = () => {
        if (i >= LINES.length) {
          card.classList.remove("tk-wait");
          done = true;
          return;
        }
        const [cls, text] = LINES[i];
        const row = rows[i];
        row.classList.add("tk-car");
        row.textContent = text.slice(0, ++k);
        if (k >= text.length) {
          row.classList.remove("tk-car");
          i++;
          k = 0;
          timer = window.setTimeout(step, cls === "ch" ? AFTER_NAME : AFTER_LINE);
        } else timer = window.setTimeout(step, PER_CHAR);
      };
      step();
    };

    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.45 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      clearTimeout(timer);
      if (!done) {
        // leaving mid-scene: put the full text back
        rows.forEach((r, j) => (r.textContent = LINES[j][1]));
        card.classList.remove("tk-wait");
      }
    };
  }, []);

  return (
    <div className="tk-sp" ref={box}>
      {LINES.map(([c, t], i) => (
        <div key={i} className={"tk-" + c}>
          {t}
        </div>
      ))}
    </div>
  );
}
