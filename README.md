# Rulers Studio

The website of **Rulers Studio**, an AI film studio working with brands worldwide. We make AI ad creatives, AI product videos, AI brand stories and UGC ads for brands.

Built with Next.js 14 (App Router), React 18, TypeScript, GSAP + ScrollTrigger, Lenis smooth scrolling and hand-written WebGL particle scenes.

---

## What's on the site

| Page | What it does |
| --- | --- |
| **Home** (`/`) | Opening R mark and showreel, a 3D "work tree" of films, studio numbers, a *Speculative work* logo marquee, a WebGL Services stage, the four-step process with 3D scenes, an FAQ and the contact form |
| **Projects** (`/projects`) | Grid of films that autoplay muted, with a tap-for-sound button |
| **Film page** (`/projects/[slug]`) | A full-screen "screening room" that plays the film, plus more films below |
| **Join the Crew** (`/join-the-crew`) | Open roles; each role page has an application form with a CV upload |
| **Contact** (`/contact`) | Enquiry form plus a paid ₹99 "Book a strategy meet" (Razorpay, then Google Calendar booking) |

### Features

- **Forms that land in Google Sheets.** Website enquiries go to the "Website Sales Call" sheet; job applications go to the "Join the Crew" sheet, with the CV saved to Google Drive and linked in the row.
- **Strict validation.** Indian 10-digit mobile numbers and real email addresses are checked in the browser and again on the server.
- **Paid strategy meet.** Razorpay Checkout takes ₹99, the payment is verified on the server (HMAC signature), and only then does the visitor get the Google Calendar booking page.
- **SEO.** Page titles and descriptions, canonical URLs, Open Graph and Twitter cards, `sitemap.xml` with video entries, `robots.txt`, and JSON-LD structured data (Organization, WebSite, VideoObject, JobPosting, FAQPage, BreadcrumbList, ItemList).
- **Motion.** Page-transition curtain, WebGL particle formations, 3D process scenes, a logo marquee and a scroll-pinned services stage. Everything respects `prefers-reduced-motion`.

---

## Run it locally

Needs **Node.js 18.18 or newer**.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run preview` | Build, then start |

The site runs without any keys. Without them, form submissions are only printed in the terminal and the strategy meet button shows a "not set up" message.

---

## Environment variables

Put these in `.env.local` (never commit that file). `.env.example` lists them all.

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Live site address, used for canonical URLs, the sitemap and social previews |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API keys for the ₹99 strategy meet (`rzp_test_…` to try, `rzp_live_…` for real payments) |
| `MEET_BOOKING_URL` | Google Calendar appointment page shown after a successful payment |
| `SHEETS_WEBHOOK_URL` | Apps Script web-app URL of the "Website Sales Call" sheet |
| `CREW_SHEET_URL` | Apps Script web-app URL of the "Join the Crew" sheet |
| `SHEETS_SECRET` | Shared secret word; must match `SECRET` in both Apps Script files |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification code (optional) |
| `DATABASE_URL` | Optional Postgres (Prisma) connection; not needed |

---

## Google Sheets setup

The two scripts live in `apps-script/`:

- `RulersLeads.gs` → the **Website Sales Call** sheet (tabs: *Enquiries*, *Strategy Meets (paid)*)
- `RulersCrew.gs` → the **Join the Crew** sheet (tab: *Applications*; CVs go to a Drive folder)

For each one:

1. Open the sheet → **Extensions → Apps Script**, paste the whole file and click Save.
2. Replace `PASTE_YOUR_SHEETS_SECRET_HERE` with the same value as `SHEETS_SECRET` in `.env.local`.
3. Choose **setup** → **Run** and allow access.
4. **Deploy → New deployment → Web app**, Execute as: *Me*, Who has access: *Anyone*.
5. Copy the `/exec` URL into `.env.local` (`SHEETS_WEBHOOK_URL` or `CREW_SHEET_URL`) and restart the server.

---

## Editing content

Most content lives in plain data files, so changes don't need you to touch the page code:

| File | Controls |
| --- | --- |
| `data/site.ts` | Studio details, social links, services, budgets, the home work-tree films, and the intro on/off switch (`SHOW_INTRO`) |
| `data/projects.ts` | All films; `SHOWN_SLUGS` picks the ones on the Projects page |
| `data/roles.ts` | Open job roles, their bullet points and the experience options |
| `data/brands.ts` | Brands in the *Speculative work* marquee |
| `data/seo.ts` | Keywords, titles, descriptions, FAQ and structured data |
| `components/Statement.tsx` | The numbers boxes (100+ films, 200+ min, 7 days) |
| `components/Process.tsx` | The four "How we work" steps |

### Media

| Folder | What goes there |
| --- | --- |
| `public/media/films/` | Full films (`<slug>.mp4` + `<slug>.jpg` cover) |
| `public/media/previews/` | Short silent loops for the home work tree |
| `public/media/covers/` | Cover stills |
| `public/media/brands/` | White, transparent brand logos (`rolex.png`, `nike.png`, …) |
| `public/media/showreel*.mp4` | Showreel (16:9 and 9:16) |

Videos: H.264 MP4, long side up to 1920px, with `faststart` so they start playing quickly.

---

## Project structure

```
app/                 pages, API routes (enquiry, apply, meet), sitemap.xml, robots.txt
components/          UI: header, footer, hero stage, work tree, services stage, process, forms, marquee…
lib/                 motion helpers, validation, page transition, WebGL scenes, Google Sheet sender
data/                site content (see "Editing content")
apps-script/         Google Apps Script for the two Google Sheets
public/              media, logos, share image (og.jpg), logo.png
styles/globals.css   all styles
```

---

## Deploying

The easiest host is **Vercel**:

1. Import this repository on vercel.com.
2. Add the environment variables above in *Project → Settings → Environment Variables*.
3. Deploy, then point your domain (e.g. `rulersstudio.com`) at it.

After the site is live, add it to **Google Search Console** and submit `https://<your-domain>/sitemap.xml`.

---

© 2026 Rulers Studio. All rights reserved.
