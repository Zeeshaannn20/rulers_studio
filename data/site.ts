// Opening intro (typing scene → R logo). Off for now; set to true when the new intro video is ready.
export const SHOW_INTRO = false;

// Studio-wide copy and contact details (from the Developer Brief / Studio Profile).
export const SITE = {
  name: "Rulers Studio",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://rulersstudio.com",
  tagline: "We make films brands remember.", // [confirm] final tagline
  description: "We make films brands remember: AI ad creatives, product videos, brand stories and UGC ads.",
  email: "business@rulersstudio.com",
  phoneDisplay: "+91 76766 02862",
  whatsapp: "https://wa.me/917676602862",
  instagram: "https://instagram.com/rulers.studio",
  linkedin: "https://www.linkedin.com/company/rulersstudio/",
  x: "https://x.com/RulersStudio",
  youtube: "https://www.youtube.com/@rulers_studio",
  // Google Calendar appointment-schedule link of business@rulersstudio.com
  // (calendar.google.com/calendar/appointments/schedules/…). Paste it here or set NEXT_PUBLIC_BOOKING_URL.
  bookingUrl: "", // the Google booking link now lives server-side (lib/meet.ts) and opens only after payment
  // Drop a finished showreel at /public/media/showreel.mp4 and set this to "/media/showreel.mp4"
  showreel: "/media/showreel.mp4", // 16:9 cut for desktop/tablet
  showreelMobile: "/media/showreel-mobile.mp4", // 9:16 cut for phones
  showreelPoster: "/media/showreel.jpg",
  showreelPosterMobile: "/media/showreel-mobile.jpg",
  // Drop the AI intro clip at /public/intro/intro.mp4 and set this to "/intro/intro.mp4"
  introVideo: "",
  introEnterAt: 7.0, // second in the intro clip where ENTER is pressed
};

export const TICKER = ["AI Ad Creatives", "AI Product Videos", "AI Brand Stories", "UGC Ads"];

export const SERVICES = [
  {
    no: "(01)",
    title: "AI Ad Creatives",
    body: "Cinematic brand ads, made without a shoot. Our writers, AI directors and AI artists plan every shot like a real production. This is not one-click generation. Every frame is directed, refined and approved so it doesn't look like AI.",
  },
  {
    no: "(02)",
    title: "AI Product Videos",
    body: "Your product as the hero: launch films, close-ups and packshots for ads, websites and marketplaces, made from your product photos.",
  },
  {
    no: "(03)",
    title: "AI Brand Stories",
    body: "Films about why your brand exists: founder stories, origin stories and the feeling behind the product, for launches and campaigns.",
  },
  {
    no: "(04)",
    title: "UGC Ads",
    body: "Creator-style reels that feel native to Instagram and Meta ads. Built to stop the scroll and convert, without hiring a creator for every variation.",
  },
];

// H-02 film strip: 6–8 short silent clips (3–5 sec each).
// Put each MP4 in /public/media/strip/ and set `clip`, e.g. "/media/strip/neel-kamal.mp4".
// Best: 640px wide, H.264 MP4, no audio, under 1 MB each. Until a clip is set, the frame shows a poster.
// `slug` decides which project page the frame opens.
export const FILM_STRIP: { slug: string; clip?: string }[] = [
  { slug: "neel-kamal", clip: "/media/previews/neel-kamal.mp4" },
  { slug: "amul", clip: "/media/previews/amul.mp4" },
  { slug: "monster", clip: "/media/previews/monster.mp4" },
  { slug: "bonkers-corner", clip: "/media/previews/bonkers-corner.mp4" },
  { slug: "rolex", clip: "/media/previews/rolex.mp4" },
  { slug: "snitch", clip: "/media/previews/snitch.mp4" },
];

// Client names (kept for later use; the strip under the hero now shows the film strip)
export const CLIENTS = ["Emergent Labs", "Chalant Media Corp"];

export const BUDGETS = [
  "Under ₹10,000",
  "₹10,000 to ₹25,000",
  "₹25,000 to ₹50,000",
  "₹50,000 to ₹1,00,000",
  "₹1,00,000+",
];

