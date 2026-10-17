"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import TLink from "./TLink";
import Words from "./Words";
import Field from "./Field";
import Select from "./Select";
import { Arrow } from "./Icons";
import { useSubmit } from "@/lib/useSubmit";
import { enquirySchema, normalisePhone } from "@/lib/validation";
import { BUDGETS, SERVICES } from "@/data/site";
import MeetButton from "./MeetButton";

// Phone boxes keep only the 10 digits (a pasted "+91 98765-43210" becomes 9876543210); email boxes drop spaces.
const onlyPhone = (e: React.FormEvent<HTMLInputElement>) => {
  const t = e.currentTarget;
  const v = normalisePhone(t.value);
  if (t.value !== v) t.value = v;
};
const noSpaces = (e: React.FormEvent<HTMLInputElement>) => {
  const t = e.currentTarget;
  if (/\s/.test(t.value)) t.value = t.value.replace(/\s+/g, "");
};

const OTHER = "Other";
const REQUIREMENTS = [...SERVICES.map((s) => s.title), OTHER];

// G-03: enquiry form (C-01) + call booking (C-02). Sits at the bottom of Home, Projects,
// every project page, and is the whole Contact page.
export default function ContactBlock({ id = "contact", headingAs = "h2" }: { id?: string; headingAs?: "h1" | "h2" }) {
  const pathname = usePathname();
  const { errors, state, formError, onSubmit, validateField, clearError } = useSubmit("/api/enquiry", enquirySchema);
  const [picked, setPicked] = useState<string[]>([]);
  const f = (n: string) => `${id}-${n}`;
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => validateField(e.target.name, e.target.form!);
  const toggle = (s: string) => {
    clearError("services");
    if (s === OTHER) clearError("details");
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };
  const wantsOther = picked.includes(OTHER);

  return (
    <section className="contact sec" id={id}>
      <div className="panel">
        <div className="in ct">
        <div>
          <div className="ct-head">
            <span className="eyebrow">Contact</span>
            <Words as={headingAs} className="h-l" text="Have a project in mind?" />
          </div>

          {state === "sent" ? (
            <div className="sent on">
              <b>Got it. We&apos;ll reply within 24 hours.</b>
            </div>
          ) : (
            <form className="form" noValidate onSubmit={(e) => onSubmit(e, { sourcePage: pathname, services: picked.join(", ") })}>
              <Field id={f("name")} label="Your name" required error={errors.name}>
                <input id={f("name")} name="name" autoComplete="name" onBlur={blur} aria-invalid={!!errors.name} />
              </Field>
              <Field id={f("mobile")} label="Mobile number" required error={errors.mobile}>
                <div className="phone">
                  <span>+91</span>
                  <input id={f("mobile")} name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" pattern="[6-9][0-9]{9}" onInput={onlyPhone} onBlur={blur} aria-invalid={!!errors.mobile} />
                </div>
              </Field>

              <Field id={f("email")} label="Email" required full error={errors.email}>
                <input id={f("email")} name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@brand.com" onInput={noSpaces} onBlur={blur} aria-invalid={!!errors.email} />
              </Field>

              {/* What are your requirements? — pick one or more */}
              <fieldset className={"fld full req" + (errors.services ? " bad" : "")}>
                <legend>
                  What are your requirements? <i>*</i>
                </legend>
                <div className="chips">
                  {REQUIREMENTS.map((r) => (
                    <label key={r} className={"chip" + (picked.includes(r) ? " on" : "")}>
                      <input type="checkbox" checked={picked.includes(r)} onChange={() => toggle(r)} />
                      {r}
                    </label>
                  ))}
                </div>
                <span className="err">{errors.services}</span>
              </fieldset>

              {/* Project details appears only when "Other" is picked */}
              {wantsOther && (
                <Field id={f("details")} label="Project details" required full error={errors.details}>
                  <textarea id={f("details")} name="details" maxLength={1000} placeholder="Tell us what you need…" autoFocus />
                </Field>
              )}

              <Field id={f("budget")} label="Budget range" full>
                <Select id={f("budget")} name="budget" options={BUDGETS} placeholder="Select a range" />
              </Field>
              <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-foot full">
                <p className="consent">
                  <span className="free-tag">Free</span> Sending a message costs nothing. We reply within 24 hours.
                  <br />
                  By submitting, you agree to our <TLink href="/terms">Terms</TLink> and <TLink href="/privacy">Privacy Policy</TLink>.
                </p>
                <button className="btn solid" type="submit" disabled={state === "sending"}>
                  {state === "sending" ? "Sending…" : "Send message"} <Arrow />
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="talk">
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 className="h-l">Let&apos;s talk</h2>
            <p>Tell us about your project: a product ad, a brand film, UGC or a micro drama.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <MeetButton />
          </div>
        </aside>
        </div>
      </div>
    </section>
  );
}
