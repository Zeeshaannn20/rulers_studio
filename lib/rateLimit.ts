// Simple in-memory rate limit (per server instance): 5 submissions per IP per 10 minutes.
// For production at scale, swap for Upstash Redis or similar.
const hits = new Map<string, number[]>();

export function rateLimited(ip: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > limit;
}
