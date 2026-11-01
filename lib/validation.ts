import { z } from "zod";
import { countryByIso, DEFAULT_CC } from "./countries";

// ── Strict checks for every phone number and email the site asks for ──
// Indian mobile (the default): 10 digits starting 6, 7, 8 or 9 (a leading +91, 91 or 0 is accepted and removed).
// Other countries are picked next to the number box; see checkPhone.
export const PHONE_RE = /^[6-9]\d{9}$/;
// Email: name@domain.tld, letters/digits/._%+- before the @, a real domain and a 2+ letter ending.
export const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;

// Turns whatever was typed or pasted ("+91 98765-43210", "098765 43210") into the bare 10 digits.
export function normalisePhone(v: string) {
  let d = (v || "").replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

// The phone box takes any digits; the country picker beside it decides the rules (see checkPhone).
// Before parsing, the picked country is joined onto the number ("GB:7911 123456") so the number can be
// checked on its own, even while the rest of the form is still empty.
const phone = z.string({ required_error: "Enter your mobile number." }).superRefine((v, ctx) => {
  const [cc, raw] = splitPhone(v);
  if (!raw) return ctx.addIssue({ code: "custom", message: "Enter your mobile number." });
  if (raw.length > 30) return ctx.addIssue({ code: "custom", message: "That number is too long." });
  const r = checkPhone(cc, raw);
  if (r.error) ctx.addIssue({ code: "custom", message: r.error });
});
const phoneCc = z.string().trim().max(3).optional();
const joinCc = (field: string) => (data: unknown) => {
  if (!data || typeof data !== "object") return data;
  const d = { ...(data as Record<string, unknown>) };
  if (typeof d[field] === "string") d[field] = `${String(d[field + "Cc"] || DEFAULT_CC).toUpperCase()}:${d[field]}`;
  return d;
};
export function splitPhone(v: string): [string, string] {
  const m = /^([A-Za-z]{2}):([\s\S]*)$/.exec(v || "");
  return m ? [m[1], m[2].trim()] : [DEFAULT_CC, (v || "").trim()];
}

// India: exactly 10 digits starting 6 to 9. Anywhere else: 6 to 14 digits (15 max with the country code).
export function checkPhone(cc: string | undefined, raw: string): { digits: string; error?: string } {
  const c = countryByIso(cc) || countryByIso(DEFAULT_CC)!;
  if (c.iso === "IN") {
    const digits = normalisePhone(raw);
    return PHONE_RE.test(digits) ? { digits } : { digits, error: "Enter a valid 10-digit Indian mobile number, like 98765 43210." };
  }
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("00" + c.dial)) digits = digits.slice(2 + c.dial.length);
  else if (raw.trim().startsWith("+") && digits.startsWith(c.dial)) digits = digits.slice(c.dial.length);
  digits = digits.replace(/^0+/, "");
  const ok = digits.length >= 6 && digits.length <= 14 && c.dial.length + digits.length <= 15;
  return ok ? { digits } : { digits, error: `Enter a valid ${c.name} phone number.` };
}
// "+91 9876543210", "+44 7911123456": what goes to the sheet and the database. Takes the joined value.
export function formatPhone(joined: string) {
  const [cc, raw] = splitPhone(joined);
  const c = countryByIso(cc) || countryByIso(DEFAULT_CC)!;
  return `+${c.dial} ${checkPhone(c.iso, raw).digits}`;
}

const email = z
  .string({ required_error: "Enter your email." })
  .trim()
  .min(1, "Enter your email.")
  .max(120, "Keep it under 120 characters.")
  .refine((v) => v.length === 0 || (EMAIL_RE.test(v) && !v.includes("..")), "Enter a valid email, like name@gmail.com.")
  .transform((v) => v.toLowerCase());

export const enquirySchema = z
  .preprocess(joinCc("mobile"), z.object({
    name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep it under 80 characters."),
    mobile: phone,
    mobileCc: phoneCc,
    email,
    services: z.string({ required_error: "Pick at least one." }).trim().min(1, "Pick at least one.").max(300),
    details: z.string().trim().max(1000).optional().or(z.literal("")),
    budget: z.string().trim().max(40).optional().or(z.literal("")),
    sourcePage: z.string().max(200).optional(),
    rs_extra: z.string().max(200).optional(), // hidden anti-spam field (bots fill it; checked on the server only)
  }))
  .superRefine((d, ctx) => {
    // "Other" needs a description
    if (d.services.split(", ").includes("Other") && (d.details ?? "").trim().length < 5)
      ctx.addIssue({ code: "custom", path: ["details"], message: "Tell us a little about what you need." });
  });

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export const applicationSchema = z.preprocess(joinCc("phone"), z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep it under 80 characters."),
  phone,
  phoneCc,
  email,
  role: z.string().trim().min(1),
  experience: z.string().trim().min(1, "Pick your experience."),
  currentCtc: z.string().trim().min(1, "Enter your current CTC (write 0 if you're a fresher).").max(40, "Keep it short, like ₹4 LPA."),
  expectedCtc: z.string().trim().min(1, "Enter your expected CTC.").max(40, "Keep it short, like ₹6 LPA."),
  portfolio: z.string().trim().regex(/^https?:\/\/\S+\.\S+/, "Links start with http:// or https://.").max(500),
  cv: z.string().min(1, "Attach your CV: PDF or Word, up to 5 MB."),
  cvName: z.string().max(200).optional(),
  cvType: z.string().max(120).optional(),
  rs_extra: z.string().max(200).optional(),
}));

export type FieldErrors = Record<string, string>;

export function toFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message === "Required" ? "This field is required." : issue.message;
  }
  return out;
}
