import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Chrome from "@/components/Chrome";
import Intro from "@/components/Intro";
import { SHOW_INTRO } from "@/data/site";
import SmoothScroll from "@/components/SmoothScroll";
import { SITE } from "@/data/site";
import { HOME_TITLE, HOME_DESC, KEYWORDS, OG_IMAGE, orgSchema } from "@/data/seo";
import JsonLd from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/next";

// Fonts are self-hosted from /app/fonts (no request to Google at runtime). All are SIL Open Font License.
const inter = localFont({
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400" },
    { path: "./fonts/inter-500.woff2", weight: "500" },
    { path: "./fonts/inter-600.woff2", weight: "600" },
  ],
  variable: "--font-inter",
  display: "swap",
});
const mono = localFont({ src: "./fonts/jetbrains-mono-500.woff2", weight: "500", variable: "--font-mono", display: "swap" });
// Cinematic upright serif for headlines (Cormorant Garamond, like film title cards)
const serif = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-latin-600-normal.woff2", weight: "100 649", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-700-normal.woff2", weight: "650 900", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-600-italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});
// Body text across the site (paragraphs, forms, FAQ, captions)
const sans = localFont({
  src: [
    { path: "./fonts/montserrat-latin-400-normal.woff2", weight: "100 449" },
    { path: "./fonts/montserrat-latin-500-normal.woff2", weight: "450 549" },
    { path: "./fonts/montserrat-latin-600-normal.woff2", weight: "550 900" },
  ],
  variable: "--font-sans",
  display: "swap",
});
// Spaced capitals for kickers, labels, buttons and the wordmark
const caps = localFont({
  src: [
    { path: "./fonts/montserrat-latin-500-normal.woff2", weight: "400 549" },
    { path: "./fonts/montserrat-latin-600-normal.woff2", weight: "550 900" },
  ],
  variable: "--font-caps",
  display: "swap",
});

// Typewriter + handwriting for the "About the studio" screenplay page. Not preloaded: only that section uses them.
const script = localFont({
  src: [
    { path: "./fonts/courier-prime-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/courier-prime-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-script",
  display: "swap",
  preload: false,
});
const hand = localFont({ src: "./fonts/caveat-latin-700-normal.woff2", weight: "700", variable: "--font-hand", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: HOME_TITLE, template: "%s | Rulers Studio" },
  description: HOME_DESC,
  keywords: KEYWORDS,
  applicationName: "Rulers Studio",
  authors: [{ name: "Rulers Studio", url: SITE.url }],
  creator: "Rulers Studio",
  publisher: "Rulers Studio",
  category: "Video production",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Rulers Studio",
    title: HOME_TITLE,
    description: HOME_DESC,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESC, images: [OG_IMAGE.url] },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#101010",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${mono.variable} ${serif.variable} ${caps.variable} ${sans.variable} ${script.variable} ${hand.variable}`}>
      <body className={SHOW_INTRO ? "intro-on" : undefined}>
        <JsonLd data={orgSchema()} />
        <SmoothScroll />
        <Header />
        <main id="main">{children}</main>
        <Chrome />
        {SHOW_INTRO && <Intro />}
        <Analytics />
      </body>
    </html>
  );
}
