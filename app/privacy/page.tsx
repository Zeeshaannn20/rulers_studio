import type { Metadata } from "next";
import Words from "@/components/Words";
import Footer from "@/components/Footer";
import { SITE } from "@/data/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <>
      <section className="wrap page-head">
        <span className="eyebrow">Legal</span>
        <Words as="h1" className="h-l" text="Privacy Policy" immediate />
      </section>
      <section className="wrap">
        <div className="legal">
          <p>Last updated: 6 November 2026</p>
          <p>
            This page explains what Rulers Studio collects when you use rulersstudio.com, why, and who it is shared with. Questions or
            requests: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>

          <h2>What you tell us</h2>
          <p>
            When you send the contact form we receive your name, email, phone number, company and project details. When you apply through
            Join the Crew we also receive your CV and portfolio links. When you book a strategy call we receive your name and the details
            the payment and calendar pages ask for. We use this only to reply to you, run your project or review your application.
          </p>

          <h2>Payments</h2>
          <p>
            Strategy calls are paid through Razorpay. Your card, UPI or bank details go straight to Razorpay; we never see or store them.
            We only receive a payment reference.
          </p>

          <h2>Where it is kept</h2>
          <p>
            Form entries are stored in our Google Workspace (Sheets and Drive) and our database, and bookings in our calendar tool. Only the
            Rulers Studio team can open them. We keep enquiries and applications for as long as they are useful to the conversation, and
            delete them when you ask.
          </p>

          <h2>Analytics and advertising</h2>
          <p>
            We use Vercel Analytics to count visits. It does not use cookies or identify you. We also use the Meta Pixel, a small piece of
            code from Meta (Facebook and Instagram). It tells Meta when someone visits a page, sends a form, or starts or completes a payment, so we can measure our ads and show them to people likely to be interested. We never send your name,
            email or phone number with these events. Meta may use cookies and combine this with what it already knows from your Meta
            account, under{" "}
            <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
              Meta&rsquo;s privacy policy
            </a>
            . You can control ads based on this activity in your Facebook or Instagram ad settings, or block it with your browser&rsquo;s
            tracking protection.
          </p>
          <p>
            To understand how people use the site and improve it, we also use Google Analytics and Microsoft Clarity. They record
            which pages and sections you view, how far you scroll, what you click, how long you stay, and which website or link brought
            you here. Clarity can replay a visit as a recording and show heatmaps; it hides what you type into forms. Both use cookies
            and handle the data under{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&rsquo;s privacy policy
            </a>{" "}
            and{" "}
            <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">
              Microsoft&rsquo;s privacy statement
            </a>
            . When you send us a form or book a call, we save the source of your visit (for example &ldquo;Instagram ad&rdquo;) with
            it, so we know which of our posts and ads work. You can block all of this with your browser&rsquo;s tracking protection or an
            ad blocker; the site works the same.
          </p>

          <h2>Your choices</h2>
          <p>
            You can ask us to show, correct or delete what we hold about you at any time by writing to{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. We do not sell your data.
          </p>

          <h2>Concept films</h2>
          <p>Brand names shown in concept films belong to their owners; those films were not commissioned by them.</p>
        </div>
      </section>
      <Footer />
    </>
  );
}
