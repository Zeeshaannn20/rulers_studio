// All 39 portfolio videos (Developer Brief, section 6). This is the full archive —
// only the projects listed in SHOWN_SLUGS (bottom of this file) appear on the site.
// videoUrl / previewUrl: paste the hosted MP4 (Mux, Bunny, Cloudinary) or leave empty.
// Do not use Google Drive links — Drive players can't be embedded.

export type TypeTag = "AI Ad Film" | "AI Short Film" | "UGC Ad" | "AI Avatar";

export type Project = {
  slug: string;
  name: string; // short name used on the poster
  title: string; // full title on site
  typeTag: TypeTag;
  homeOrder?: number; // 1–8 = shown on Home (H-04)
  inReel?: boolean; // clip goes into the H-01 showreel
  isConcept: boolean | null; // null = [confirm]
  industry?: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  videoUrl?: string;
  previewUrl?: string;
  coverImage?: string;
  writeup?: string[];
  deliverables?: string;
  timeline?: string;
  attachments?: { label: string; href: string }[];
};


// Google Drive file IDs (portfolio folder, shared "anyone with the link").
// Used for cover frames until real covers are added to /public/media/covers/.
const DRIVE: Record<string, string> = {
  "neel-kamal": "1gdv0w0lC3DFewr-W29CZiqn1KqQFf5rl",
  "amul": "15Vyti3D6zX4LvsHZPd0qwCrvT1qiglA5",
  "monster": "1GDnR68wz2gCCK8aoX8u930N8_uVk8PTY",
  "rolex": "1XS6GJ-i_tNYgn3UZP_rQicxly6i58Abk",
  "paper-boat": "17EdJwtPrf44bRarge-r8aGHn4-dnD1xJ",
  "versace": "1MnGuut3N6BbrLNVIbwLleU-PYfVk0hLs",
  "nike": "1vy7ePQ-ukRMCMAfa2TxWICv2IfbiYx55",
  "tanishq": "1F4ULgsqbUfSOG5bhGnfABFGnz3dhUi5A",
  "sony": "1ASSrn74PSdXBMrTWbcQh4_hH0b9j7Eu_",
  "boat-lifestyle": "1pGn2Yxw5IxCFt3JGCg7dj2EROeNCzOJX",
  "blinkit": "1w2r7NYO186wljc73Hyu3ZXxqqCo9L07y",
  "licious": "1_8_TufdxlWybxWn9Jgxl6PHwKWaL-KFv",
  "dot-and-key": "1GHD5V5N0mM28cp4n7vGSexyH_PiCxGYY",
  "campa": "1vLxGD6FCV3dDSYPobqVx1aq9DUPgDX1a",
  "the-souled-store": "1w3jpuaM6kws3sW7nYdgQjrbOvSGjcg-W",
  "bonkers-corner": "1JxW3ouIKtmr7i38b7bFkYl4lntDvY8zt",
  "neuro": "1V61izMDEOLqjehSL003t5UdjXyHvtl8c",
  "perfume-film": "1B3v3Z4AtM1b1bA8Ey-o9GObXeF8gd_zo",
  "akshmala": "11ZDqJwwfKrCx4cflkQ7FGdpUqrA4fRw_",
  "bilarabi": "1r_SUVJb0GkZjorDk9zWnpchO8LLivrYr",
  "nish-hair": "1tYoxuL83HJU4LwGvOZXtRYwnRyJn5JTD",
  "trailer": "1qQ3NBjwkbrUwBWhlBkH9gkqZ38H1wmRR",
  "the-only-regret": "1AX3-gdMAarwSsefvZ_xbaFUtF-_sZqeF",
  "happy-birthday": "1716J3t-Q0bgNKTi8-vvnI3a4WrAeFsyC",
  "chhath-puja": "15gO4RdXtx9xTEZbWEv6XK84jSoaXGlyi",
  "nanhi-pari": "13OcfrvDulnhXOP2krgY9pIUea0E5Zt0p",
  "samurai": "1YuSJN2G1-x-mQOeioqMIFYcA1jBQEKTO",
  "noctis": "1NDf1bzWeZa2UE4n_bpgoAFsWXSkZnApT",
  "hm-ugc": "1gHmOJkEkTLSKXwiopu0Tm1-E7nO8-1Ru",
  "the-row-ugc": "18yWaDfuVaEDo1sLFLk4nqDwSN70rlQZ7",
  "versace-ugc": "1DaBaY2NjZHiPp23b5teDjO7RE7uPqcPf",
  "wear-jiti": "1cBOAKB5oEn_tttyh9WySAJCgXSVFSyxt",
  "ninjas-ai-automation": "1fBsZRWq4p6cLbBGAeAr-Z_IwkX4ilelj",
  "hair-product-ugc": "1JZuCrzgYki-C18KuGzw5_i6BEeQkz6ci",
  "us-brand-ugc": "1eceDn2uj_8MUEfRdbPv1Dd4o3WuvbCnJ",
  "handwoven-dupatta-1": "1B9-EQKbA1FDkNhcxd_JmXUoJObWQpyuO",
  "handwoven-dupatta-2": "1yST6XBXt8xIq_khOLC99AdEc5BOZV5PP",
  "sam-ai-presenter": "1JC2okd1yg7zPWWz2HUJ2ue5oklx0NUWG",
  "sammy-ai-presenter": "1bciQa8InJuMyDPQH40sdp8pWoqT8t6WS",
};
export const driveCover = (slug: string, w = 1600) =>
  DRIVE[slug] ? `https://drive.google.com/thumbnail?id=${DRIVE[slug]}&sz=w${w}` : undefined;

// Ad films that were made vertical (9:16)
const VERTICAL = new Set(["rolex", "snitch"]);

type Row = [string, string, TypeTag, number, boolean | null, string | undefined, boolean?];

const suffix: Record<TypeTag, string> = {
  "AI Ad Film": "Ad Film",
  "AI Short Film": "Short Film",
  "UGC Ad": "UGC Ad",
  "AI Avatar": "AI Presenter",
};

// [slug, name, tag, homeOrder (0 = not on Home), concept, industry, inReel]
const ROWS: Row[] = [
  ["neel-kamal", "Nilkamal", "AI Ad Film", 1, null, undefined, true],
  ["amul", "Amul", "AI Ad Film", 2, null, "Dairy / FMCG", true],
  ["monster", "Monster", "AI Ad Film", 3, true, "Beverages", true],
  ["the-only-regret", "The Only Regret", "AI Short Film", 4, false, "Original film"],
  ["rolex", "Rolex", "AI Ad Film", 5, true, "Luxury watches", true],
  ["snitch", "Snitch", "AI Ad Film", 6, true, "Fashion", true],
  ["noctis", "Noctis", "UGC Ad", 0, null, undefined],
  ["paper-boat", "Paper Boat", "AI Ad Film", 7, true, "Beverages", true],
  ["versace", "Versace", "AI Ad Film", 8, true, "Fashion", true],
  ["nike", "Nike", "AI Ad Film", 0, true, "Sportswear", true],
  ["tanishq", "Tanishq", "AI Ad Film", 0, true, "Jewellery", true],
  ["sony", "Sony", "AI Ad Film", 0, true, "Electronics"],
  ["boat-lifestyle", "boAt Lifestyle", "AI Ad Film", 0, true, "Electronics"],
  ["blinkit", "Blinkit", "AI Ad Film", 0, true, "Quick commerce"],
  ["licious", "Licious", "AI Ad Film", 0, true, "Food"],
  ["dot-and-key", "Dot & Key", "AI Ad Film", 0, true, "Skincare"],
  ["campa", "Campa", "AI Ad Film", 0, true, "Beverages"],
  ["the-souled-store", "The Souled Store", "AI Ad Film", 0, true, "Fashion"],
  ["bonkers-corner", "Bonkers Corner", "AI Ad Film", 0, true, "Fashion"],
  ["neuro", "Neuro", "AI Ad Film", 0, true, "Beverages"],
  ["perfume-film", "Perfume Film", "AI Ad Film", 0, null, "Fragrance"],
  ["akshmala", "Akshmala", "AI Ad Film", 0, null, undefined],
  ["bilarabi", "Bilarabi", "AI Ad Film", 0, null, undefined],
  ["nish-hair", "Nish Hair", "AI Ad Film", 0, null, "Hair care"],
  ["trailer", "Trailer", "AI Ad Film", 0, null, undefined],
  ["happy-birthday", "Happy Birthday", "AI Short Film", 0, false, "Original film (horror-thriller)"],
  ["chhath-puja", "Chhath Puja", "AI Short Film", 0, false, "Original film"],
  ["nanhi-pari", "Nanhi Pari", "AI Short Film", 0, false, "Original film"],
  ["samurai", "Samurai", "AI Short Film", 0, false, "Original film"],
  ["hm-ugc", "H&M", "UGC Ad", 0, true, "Fashion"],
  ["the-row-ugc", "The Row", "UGC Ad", 0, true, "Fashion"],
  ["versace-ugc", "Versace", "UGC Ad", 0, true, "Fashion"],
  ["wear-jiti", "Wear Jiti", "UGC Ad", 0, null, "Fashion"],
  ["ninjas-ai-automation", "Ninjas AI Automation", "UGC Ad", 0, null, "Tech / SaaS"],
  ["hair-product-ugc", "Hair Product", "UGC Ad", 0, null, "Hair care"],
  ["us-brand-ugc", "US Brand", "UGC Ad", 0, null, undefined],
  ["handwoven-dupatta-1", "Dupatta 1", "UGC Ad", 0, null, "Ethnic wear"],
  ["handwoven-dupatta-2", "Dupatta 2", "UGC Ad", 0, null, "Ethnic wear"],
  ["sam-ai-presenter", "Sam", "AI Avatar", 0, false, "AI avatar"],
  ["sammy-ai-presenter", "Sammy", "AI Avatar", 0, false, "AI avatar"],
  ["automotive-film", "Automotive Film", "AI Ad Film", 0, true, "Automotive"],
];

// Frames and short hover loops cut from the films themselves (in /public/media)
const LOCAL_COVER: Record<string, string> = { "neel-kamal": "/media/covers/neel-kamal.jpg", amul: "/media/covers/amul.jpg", snitch: "/media/covers/snitch.jpg", monster: "/media/covers/monster.jpg", rolex: "/media/covers/rolex.jpg" };
const LOCAL_PREVIEW: Record<string, string> = { "neel-kamal": "/media/previews/neel-kamal.mp4", amul: "/media/previews/amul.mp4", snitch: "/media/previews/snitch.mp4", monster: "/media/previews/monster.mp4", rolex: "/media/previews/rolex.mp4" };

// Full films with sound (in /public/media/films): muted at first, visitors can turn the sound on.
// Blinkit: add /public/media/films/blinkit.mp4 + blinkit.jpg and put "blinkit" in this list.
const FILMS = new Set(["bonkers-corner", "snitch", "rolex", "amul", "automotive-film", "neel-kamal"]);

export const PROJECTS: Project[] = ROWS.map(([slug, name, typeTag, home, isConcept, industry, inReel]) => ({
  slug,
  name,
  title: `${name} ${suffix[typeTag]}`,
  typeTag,
  homeOrder: home || undefined,
  inReel: !!inReel,
  isConcept,
  industry,
  aspectRatio: typeTag === "UGC Ad" || typeTag === "AI Avatar" || VERTICAL.has(slug) ? "9:16" : "16:9",
  deliverables: typeTag,
  coverImage: FILMS.has(slug) ? `/media/films/${slug}.jpg` : LOCAL_COVER[slug] ?? driveCover(slug),
  // Projects page cards play a light 6-second silent loop; the full film loads only on tap-for-sound or its own page
  previewUrl: FILMS.has(slug) ? `/media/previews/cards/${slug}.mp4` : LOCAL_PREVIEW[slug],
  videoUrl: FILMS.has(slug) ? `/media/films/${slug}.mp4` : undefined,
  attachments:
    slug === "the-only-regret"
      ? [
          { label: "Moodboard (PDF)", href: "https://drive.google.com/file/d/1I7CSq933r5cST_6SbrDbj3Y7fOEyuY2l/view" },
          { label: "Abstract (PDF)", href: "https://drive.google.com/file/d/1zYejSjpdQxE0tvxP99RUuuAGV_8bdZLa/view" },
        ]
      : undefined,
}));

// ─── WORK SHOWN ON THE SITE (max 6) ───────────────────────────────────────────
// Only these projects appear anywhere on the site, in this order.
// To swap one, replace its slug with any slug from the list above. Keep 6 or fewer.
export const SHOWN_SLUGS = ["bonkers-corner", "snitch", "rolex", "amul", "neel-kamal", "automotive-film"];
export const MAX_SHOWN = 6;

export const SHOWN_PROJECTS: Project[] = SHOWN_SLUGS.slice(0, MAX_SHOWN)
  .map((slug) => PROJECTS.find((p) => p.slug === slug))
  .filter((p): p is Project => !!p);

// Kept for compatibility: Home and Projects both use the same 6
export const SORTED_PROJECTS = SHOWN_PROJECTS;
export const HOME_PROJECTS = SHOWN_PROJECTS;

// Films on the Home work tree also keep their pages
const TREE_SLUGS = ["neel-kamal", "amul", "monster", "bonkers-corner", "rolex", "snitch"];
export const PAGE_PROJECTS: Project[] = PROJECTS.filter((p) => SHOWN_SLUGS.includes(p.slug) || TREE_SLUGS.includes(p.slug));

// Only these projects have a page; any other slug returns 404
export const getProject = (slug: string) => PAGE_PROJECTS.find((p) => p.slug === slug);

export function nextProjects(slug: string, n = 2) {
  const i = Math.max(0, SHOWN_PROJECTS.findIndex((p) => p.slug === slug));
  return Array.from({ length: Math.min(n, SHOWN_PROJECTS.length - 1) }, (_, k) => SHOWN_PROJECTS[(i + 1 + k) % SHOWN_PROJECTS.length]);
}

// Poster mood per industry: two dark tones, no stock imagery
const MOODS: Record<string, [string, string]> = {
  Beverages: ["#0f3d2a", "#04120c"],
  "Luxury watches": ["#3a2e12", "#0d0a03"],
  Fashion: ["#2b1636", "#0b0610"],
  Sportswear: ["#3b1410", "#0e0504"],
  Jewellery: ["#40300c", "#0e0a02"],
  Electronics: ["#0f2140", "#040814"],
  "Quick commerce": ["#3d3a07", "#0e0d02"],
  Food: ["#40160f", "#100503"],
  Skincare: ["#3a1d2a", "#0e070a"],
  Fragrance: ["#2a1a3d", "#08050e"],
  "Hair care": ["#3a2410", "#0e0904"],
  "Dairy / FMCG": ["#123445", "#040c10"],
  "Ethnic wear": ["#3d1022", "#0f0408"],
  "Tech / SaaS": ["#0f2e3a", "#040b0e"],
  "AI avatar": ["#1d2b10", "#070b04"],
  Automotive: ["#1a1d22", "#060708"],
};

export function posterGradient(p: Project) {
  const m = (p.industry && MOODS[p.industry]) || (p.typeTag === "AI Short Film" ? ["#26261f", "#08080a"] : ["#1e2112", "#070805"]);
  return `radial-gradient(120% 80% at 80% 10%, ${m[0]} 0%, transparent 60%), radial-gradient(90% 70% at 10% 100%, rgba(214,185,143,.12), transparent 55%), linear-gradient(160deg, ${m[0]} 0%, ${m[1]} 70%)`;
}
