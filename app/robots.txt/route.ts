import { SITE } from "@/data/site";

// Served as /robots.txt. (A route handler instead of app/robots.ts: Next's metadata loader
// breaks when the project folder name contains an apostrophe, like "ayush's ruler".)
export const dynamic = "force-static";

export function GET() {
  const base = SITE.url.replace(/\/$/, "");
  const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /api", "Disallow: /book", "", `Sitemap: ${base}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
