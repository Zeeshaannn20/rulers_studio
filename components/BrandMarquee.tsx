import fs from "node:fs";
import path from "node:path";
import { BRANDS } from "@/data/brands";

// Finds a logo file for each brand at build time (public/media/brands/<slug>.svg|png|webp) and,
// for PNGs, reads its size so wide logos (SONY, SNITCH) and tall ones (Rolex) look equally big.
function logoFor(slug: string): { src: string; scale: number } | null {
  const dir = path.join(process.cwd(), "public", "media", "brands");
  for (const ext of ["svg", "png", "webp"]) {
    const file = path.join(dir, `${slug}.${ext}`);
    if (!fs.existsSync(file)) continue;
    let scale = 1;
    if (ext === "png") {
      const b = fs.readFileSync(file);
      const w = b.readUInt32BE(16);
      const h = b.readUInt32BE(20);
      if (w && h) scale = Math.max(0.55, Math.min(1.15, Math.sqrt(2.2 / (w / h))));
    }
    return { src: `/media/brands/${slug}.${ext}`, scale };
  }
  return null;
}

// "Speculative work": the brands we've made concept films for, gliding past in two rows that run
// in opposite directions. Hovering a row slows it down and lights the brand under the pointer.
export default function BrandMarquee() {
  const items = BRANDS.map((b) => ({ ...b, logo: logoFor(b.slug) }));
  const half = Math.ceil(items.length / 2);
  const rows = [items, [...items.slice(half), ...items.slice(0, half)].reverse()];

  return (
    <div className="bm" aria-label="Speculative work">
      <div className="bm-head">
        <span className="eyebrow">Speculative work</span>
      </div>
      <ul className="sr-only">
        {items.map((b) => (
          <li key={b.slug}>{b.name}</li>
        ))}
      </ul>
      {rows.map((row, ri) => (
        <div className={"bm-row" + (ri ? " rev" : "")} key={ri} aria-hidden="true">
          <div className="bm-track">
            {[0, 1].map((copy) => (
              <div className="bm-set" key={copy}>
                {row.map((b) => (
                  <span
                    className={"bm-item" + (b.logo ? " has-logo" : "")}
                    key={b.slug}
                    style={b.logo ? ({ "--s": b.logo.scale } as React.CSSProperties) : undefined}
                  >
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo.src} alt="" loading="lazy" decoding="async" />
                    ) : null}
                    <b>{b.name}</b>
                    <i className="bm-star">✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
