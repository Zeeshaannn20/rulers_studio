import { z } from "zod";

// ── Strict checks for every phone number and email the site asks for ──
// Indian mobile: 10 digits starting 6, 7, 8 or 9 (a leading +91, 91 or 0 is accepted and removed).
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

const phone = z
  .string({ required_error: "Enter your 10-digit mobile number." })
  .trim()
  .transform(normalisePhone)
  .refine((v) => v.length > 0, "Enter your 10-digit mobile number.")
  .refine((v) => v.length === 0 || PHONE_RE.test(v), "Enter a valid 10-digit Indian mobile number, like 98765 43210.");

const email = z
  .string({ required_error: "Enter your email." })
  .trim()
  .min(1, "Enter your email.")
  .max(120, "Keep it under 120 characters.")
  .refine((v) => v.length === 0 || (EMAIL_RE.test(v) && !v.includes("..")), "Enter a valid email, like name@gmail.com.")
  .transform((v) => v.toLowerCase());

export const enquirySchema = z
  .object({
    name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep it under 80 characters."),
    mobile: phone,
    email,
    services: z.string({ required_error: "Pick at least one." }).trim().min(1, "Pick at least one.").max(300),
    details: z.string().trim().max(1000).optional().or(z.literal("")),
    budget: z.string().trim().max(40).optional().or(z.literal("")),
    sourcePage: z.string().max(200).optional(),
    rs_extra: z.string().max(200).optional(), // hidden anti-spam field (bots fill it; checked on the server only)
  })
  .superRefine((d, ctx) => {
    // "Other" needs a description
    if (d.services.split(", ").includes("Other") && (d.details ?? "").trim().length < 5)
      ctx.addIssue({ code: "custom", path: ["details"], message: "Tell us a little about what you need." });
  });

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export const applicationSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Keep it under 80 characters."),
  phone,
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
});

export type FieldErrors = Record<string, string>;

export function toFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message === "Required" ? "This field is required." : issue.message;
  }
  return out;
}
