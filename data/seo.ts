// SEO: target keywords, page titles/descriptions and structured data (JSON-LD) in one place.
// Keyword groups are ordered by how broad (high-volume) the search is. Check real volumes in
// Google Search Console → Performance once the site has been live for a few weeks.
import { SITE, SERVICES } from "./site";
import type { Project } from "./projects";
import type { Role } from "./roles";

export const BASE = SITE.url.replace(/\/$/, "");
export const abs = (path = "/") => (path.startsWith("http") ? path : BASE + (path.startsWith("/") ? path : "/" + path));

// Date the site (and its films) went live — used for structured data. Update when films are added.
export const PUBLISHED = "2026-10-17";

export const KEYWORDS = [
  // broad, high-volume
  "ad film makers",
  "ad film production house",
  "video production company",
  "corporate video production",
  "product video",
  // AI-specific, fast-growing
  "AI video production company",
  "AI video production company",
  "AI ad agency",
  "AI advertising agency",
  "AI ad film",
  "AI ad films",
  "AI video ads",
  "AI commercial",
  "AI generated ads",
  "AI product videos",
  "AI UGC ads",
  "UGC ads",
  "UGC video ads",
  "AI commercial production",
  "AI brand film",
  "AI short film",
  "AI brand film",
  "AI product video",
  "AI film studio",
  "generative AI video agency",
];

export const HOME_TITLE = "Rulers Studio | AI Ad Film & AI Video Production Studio";
export const HOME_DESC =
  "AI video production studio working with brands worldwide. We make AI ad films, AI commercials, product videos, brand stories and UGC ads.";

export const OG_IMAGE = { url: "/og.jpg", width: 1200, height: 630, alt: "Rulers Studio, AI ad film and AI video production studio" };

// ── Structured data ──────────────────────────────────────────────────────────
const ORG_ID = abs("/#organization");

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": ORG_ID,
        name: SITE.name,
        alternateName: ["Rulers", "The Rulers Studio"],
        url: abs("/"),
        logo: abs("/logo.png"),
        image: abs(OG_IMAGE.url),
        description: HOME_DESC,
        slogan: SITE.tagline.replace(/\.$/, ""),
        areaServed: "Worldwide",
        sameAs: [SITE.instagram, SITE.linkedin, SITE.x, SITE.youtube].filter(Boolean),
        knowsAbout: ["AI video production", "AI ad films", "AI commercials", "AI product videos", "AI brand stories", "UGC ads", "Generative AI filmmaking"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "AI video production services",
          itemListElement: SERVICES.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.title, description: s.body, serviceType: s.title, areaServed: "Worldwide", provider: { "@id": ORG_ID } },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": abs("/#website"),
        url: abs("/"),
        name: SITE.name,
        description: HOME_DESC,
        inLanguage: "en-IN",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export const projectLabel = (p: Project) => `${p.name} ${p.typeTag}${p.isConcept ? " (Concept)" : ""}`;

export function projectDescription(p: Project) {
  const kind = p.typeTag.replace("Ad Film", "ad film").replace("Short Film", "short film").replace("UGC Ad", "UGC ad").replace("AI Avatar", "AI avatar video");
  const concept = p.isConcept ? "a concept " : "an ";
  return `${p.name}: ${concept}${kind}${p.industry ? ` for ${p.industry.toLowerCase()}` : ""}, made with generative AI by Rulers Studio, an AI video production studio.`;
}

export function videoSchema(p: Project) {
  if (!p.videoUrl) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: projectLabel(p),
    description: projectDescription(p),
    thumbnailUrl: p.coverImage ? [abs(p.coverImage)] : [abs(OG_IMAGE.url)],
    uploadDate: PUBLISHED,
    contentUrl: abs(p.videoUrl),
    embedUrl: abs(`/projects/${p.slug}`),
    inLanguage: "en-IN",
    genre: p.typeTag,
    creator: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

export function itemListSchema(projects: Project[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI ad films and AI videos by Rulers Studio",
    itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/projects/${p.slug}`), name: projectLabel(p) })),
  };
}

export function jobSchema(r: Role) {
  const list = (items: string[]) => `<ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul>`;
  const valid = new Date(PUBLISHED);
  valid.setMonth(valid.getMonth() + 3);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: r.title,
    description: `<p><strong>${r.tagline}</strong> ${r.summary}</p><p>What you'll do:</p>${list(r.responsibilities)}<p>What we're looking for:</p>${list(r.requirements)}`,
    datePosted: PUBLISHED,
    validThrough: valid.toISOString().slice(0, 10),
    employmentType: "FULL_TIME",
    directApply: true,
    industry: "Advertising, Film and Video Production",
    occupationalCategory: r.title,
    hiringOrganization: { "@type": "Organization", name: SITE.name, sameAs: abs("/"), logo: abs("/logo.png") },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "IN" } },
    url: abs(`/join-the-crew/${r.slug}`),
  };
}

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is an AI ad film?",
    a: "An AI ad film is a brand commercial made with generative AI instead of a physical shoot. At Rulers Studio our writers, AI directors and AI artists still plan every shot like a real production, so the final film looks cinematic, not computer-generated.",
  },
  {
    q: "What kinds of AI videos do you make?",
    a: "AI ad creatives and commercials, AI product videos, AI brand stories, and UGC-style video ads for Instagram and Meta.",
  },
  {
    q: "How much does an AI ad film cost?",
    a: "It depends on the length, the number of shots and characters, and how many versions you need for different platforms. Send us your brief through the form and we'll come back with a clear quote.",
  },
  {
    q: "How long does it take to make an AI video ad?",
    a: "Most AI ad films are delivered in days, not weeks, because there's no location, crew or reshoot to plan. We confirm the exact timeline with your quote.",
  },
  {
    q: "Will the video look like AI?",
    a: "No. Every frame is directed, refined and approved by our team: consistent faces, real lighting, proper camera moves, original music and full sound design. It plays like a real film.",
  },
  {
    q: "Do I need to send product footage?",
    a: "No shoot is needed. We can make product videos from your product photos, plus your logo and brand guidelines.",
  },
  {
    q: "Can you make UGC ads without hiring creators?",
    a: "Yes. We make creator-style UGC video ads that feel native to Instagram Reels and Meta ads, and we can produce many variations for testing without booking a creator for each one.",
  },
  {
    q: "Do you work with brands worldwide?",
    a: "Yes. We work with brands all over the world. Everything from the brief to the final film is handled online.",
  },
];

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
