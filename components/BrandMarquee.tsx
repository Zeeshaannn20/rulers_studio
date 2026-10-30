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

// "Speculative work" as a strip of 35mm film running through a projector: every brand sits in its
// own frame between sprocket holes, the strip weaves gently in the gate, and the frame passing the
// lit gate in the middle lights up under the projector beam (flicker, grain and scratches included).
export default function BrandMarquee() {
  const items = BRANDS.map((b) => ({ ...b, logo: logoFor(b.slug) })).filter((b) => b.logo);

  return (
    <div className="fr" aria-label="Speculative work">
      <div className="fr-head">
        <span className="eyebrow">Speculative work</span>
        <span className="fr-tag" aria-hidden="true">
          <b /> Reel 01 · 35mm · {String(items.length).padStart(2, "0")} films
        </span>
      </div>
      <ul className="sr-only">
        {items.map((b) => (
          <li key={b.slug}>{b.name}</li>
        ))}
      </ul>

      <div className="fr-stage" aria-hidden="true">
        <div className="fr-beam" />
        <div className="fr-film">
          <div className="fr-track">
            {[0, 1].map((copy) =>
              items.map((b, i) => (
                <div className="fr-frame" key={copy + b.slug}>
                  <span className="fr-no">{String(i + 1).padStart(2, "0")}A</span>
                  <div className="fr-win">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.logo!.src} alt="" loading="lazy" decoding="async" style={{ "--s": b.logo!.scale } as React.CSSProperties} />
                  </div>
                  <span className="fr-edge">RULERS STUDIO ▸ SAFETY FILM ▸ {String(i + 1).padStart(2, "0")}</span>
                </div>
              ))
            )}
          </div>
          <div className="fr-gate">
            <span className="fr-now">
              <i /> Now screening
            </span>
            <i className="c tl" />
            <i className="c tr" />
            <i className="c bl" />
            <i className="c br" />
          </div>
        </div>
        <div className="fr-grain" />
        <div className="fr-scratch">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
