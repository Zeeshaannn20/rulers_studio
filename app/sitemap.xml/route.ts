import { PAGE_PROJECTS } from "@/data/projects";
import { OPEN_ROLES } from "@/data/roles";
import { BASE, PUBLISHED, abs, projectDescription, projectLabel } from "@/data/seo";

// Served as /sitemap.xml (a route handler instead of app/sitemap.ts: Next's metadata loader
// breaks when the project folder name contains an apostrophe, like "ayush's ruler").
// Includes video entries so Google can show the films in video results.
export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const pages: { path: string; priority: string; freq: string; extra?: string }[] = [
    { path: "/", priority: "1.0", freq: "weekly" },
    { path: "/projects", priority: "0.9", freq: "weekly" },
    { path: "/contact", priority: "0.8", freq: "monthly" },
    { path: "/join-the-crew", priority: "0.7", freq: "weekly" },
    ...PAGE_PROJECTS.map((p) => ({
      path: `/projects/${p.slug}`,
      priority: "0.8",
      freq: "monthly",
      extra: p.videoUrl
        ? `<video:video><video:thumbnail_loc>${esc(abs(p.coverImage || "/og.jpg"))}</video:thumbnail_loc><video:title>${esc(projectLabel(p))}</video:title><video:description>${esc(projectDescription(p))}</video:description><video:content_loc>${esc(abs(p.videoUrl))}</video:content_loc><video:publication_date>${PUBLISHED}</video:publication_date><video:family_friendly>yes</video:family_friendly></video:video>`
        : p.coverImage && p.coverImage.startsWith("/")
          ? `<image:image><image:loc>${esc(abs(p.coverImage))}</image:loc></image:image>`
          : "",
    })),
    ...OPEN_ROLES.map((r) => ({ path: `/join-the-crew/${r.slug}`, priority: "0.6", freq: "weekly" })),
    { path: "/terms", priority: "0.2", freq: "yearly" },
    { path: "/privacy", priority: "0.2", freq: "yearly" },
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    pages
      .map((p) => `  <url><loc>${esc(BASE + p.path)}</loc><lastmod>${PUBLISHED}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority>${p.extra || ""}</url>`)
      .join("\n") +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
