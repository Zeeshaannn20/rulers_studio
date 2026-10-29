"use client";
import { useRef, useState } from "react";
import TLink from "./TLink";
import Field from "./Field";
import Select from "./Select";
import { Arrow } from "./Icons";
import { useSubmit } from "@/lib/useSubmit";
import { applicationSchema, CV_MAX_BYTES, CV_TYPES, normalisePhone } from "@/lib/validation";
import { EXPERIENCE } from "@/data/roles";

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

type CV = { name: string; type: string; size: number; data: string };

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

// Join the Crew application: name, phone, email, experience, CTC, CV upload, portfolio → Google Sheet
export default function ApplyForm({ role, roleTitle }: { role: string; roleTitle: string }) {
  const { errors, state, formError, onSubmit, validateField, clearError } = useSubmit("/api/apply", applicationSchema);
  const [cv, setCv] = useState<CV | null>(null);
  const [cvError, setCvError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const blur = (e: React.FocusEvent<HTMLInputElement>) => validateField(e.target.name, e.target.form!);

  async function takeFile(file?: File | null) {
    setCvError("");
    clearError("cv");
    if (!file) return;
    const okType = CV_TYPES.includes(file.type) || /\.(pdf|docx?)$/i.test(file.name);
    if (!okType) return setCvError("Use a PDF or Word file.");
    if (file.size > CV_MAX_BYTES) return setCvError(`That file is ${size(file.size)}. Keep it under 5 MB.`);
    const type = CV_TYPES.includes(file.type)
      ? file.type
      : /\.pdf$/i.test(file.name)
        ? CV_TYPES[0]
        : /\.docx$/i.test(file.name)
          ? CV_TYPES[2]
          : CV_TYPES[1];
    try {
      setCv({ name: file.name, type, size: file.size, data: await readAsBase64(file) });
    } catch {
      setCvError("Couldn't read that file. Try another one.");
    }
  }

  function clearCv() {
    setCv(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (state === "sent")
    return (
      <div className="sent on apply-sent" style={{ alignSelf: "start" }}>
        <b>Application sent.</b>
        <p>Thanks for applying for {roleTitle}. If there&apos;s a fit, we&apos;ll reach out within 7 days.</p>
      </div>
    );

  const cvMsg = cvError || errors.cv;

  return (
    <form
      className="form apply-form"
      noValidate
      onSubmit={(e) => onSubmit(e, { role, cv: cv?.data || "", cvName: cv?.name || "", cvType: cv?.type || "" })}
    >
      <div className="apply-head full">
        <span className="eyebrow">Apply</span>
        <h3>
          Apply for <em>{roleTitle}</em>
        </h3>
      </div>

      <Field id="ap-name" label="Full name" required full error={errors.name}>
        <input id="ap-name" name="name" autoComplete="name" onBlur={blur} aria-invalid={!!errors.name} />
      </Field>
      <Field id="ap-phone" label="Phone number" required error={errors.phone}>
        <div className="phone">
          <span>+91</span>
          <input id="ap-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" pattern="[6-9][0-9]{9}" onInput={onlyPhone} onBlur={blur} aria-invalid={!!errors.phone} />
        </div>
      </Field>
      <Field id="ap-email" label="Email" required error={errors.email}>
        <input id="ap-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="name@gmail.com" onInput={noSpaces} onBlur={blur} aria-invalid={!!errors.email} />
      </Field>
      <Field id="ap-exp" label="Experience" required full error={errors.experience}>
        <Select id="ap-exp" name="experience" options={EXPERIENCE} placeholder="Select your experience" onChange={() => clearError("experience")} />
      </Field>
      <Field id="ap-cur" label="Current CTC" required error={errors.currentCtc}>
        <input id="ap-cur" name="currentCtc" placeholder="e.g. ₹4 LPA, or 0 if fresher" onBlur={blur} aria-invalid={!!errors.currentCtc} />
      </Field>
      <Field id="ap-exp-ctc" label="Expected CTC" required error={errors.expectedCtc}>
        <input id="ap-exp-ctc" name="expectedCtc" placeholder="e.g. ₹6 LPA" onBlur={blur} aria-invalid={!!errors.expectedCtc} />
      </Field>

      <div className={"fld full" + (cvMsg ? " bad" : "")}>
        <label htmlFor="ap-cv">
          CV <i>*</i>
        </label>
        {cv ? (
          <div className="cv-file">
            <span className="cv-ic" aria-hidden="true">
              {cv.type === CV_TYPES[0] ? "PDF" : "DOC"}
            </span>
            <span className="cv-name">
              <b>{cv.name}</b>
              <small>{size(cv.size)}</small>
            </span>
            <button type="button" className="cv-x" onClick={clearCv}>
              Change
            </button>
          </div>
        ) : (
          <label
            className={"cv-drop" + (drag ? " drag" : "")}
            htmlFor="ap-cv"
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              takeFile(e.dataTransfer.files?.[0]);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 16V4m0 0-5 5m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>
              <b>Upload your CV</b> or drag it here
            </span>
            <small>PDF or Word · up to 5 MB</small>
          </label>
        )}
        <input
          ref={fileRef}
          id="ap-cv"
          name="cv"
          type="file"
          className="cv-input"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => takeFile(e.target.files?.[0])}
        />
        <span className="err">{cvMsg}</span>
      </div>

      <Field id="ap-portfolio" label="Portfolio link" required full error={errors.portfolio}>
        <input id="ap-portfolio" name="portfolio" type="url" inputMode="url" placeholder="https://drive.google.com/… or your showreel" onBlur={blur} aria-invalid={!!errors.portfolio} />
      </Field>

      <input className="hp" name="rs_extra" type="text" tabIndex={-1} autoComplete="new-password" data-lpignore="true" data-1p-ignore aria-hidden="true" />
      {formError && <p className="form-error">{formError}</p>}
      <div className="form-foot full">
        <p className="consent">
          By applying, you agree to our <TLink href="/terms">Terms</TLink> and <TLink href="/privacy">Privacy Policy</TLink>.
        </p>
        <button className="btn solid" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Submitting…" : "Submit application"} <Arrow />
        </button>
      </div>
    </form>
  );
}
