"use client";
import { useState } from "react";
import type { ZodTypeAny } from "zod";
import { toFieldErrors, type FieldErrors } from "./validation";

// Validates in the browser with the same schema the API uses, then posts JSON.
export function useSubmit(endpoint: string, schema: ZodTypeAny) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [formError, setFormError] = useState("");

  function validateField(name: string, form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const r = schema.safeParse(data);
    const all = r.success ? {} : toFieldErrors(r.error);
    setErrors((e) => ({ ...e, [name]: data[name] === "" && !all[name] ? "" : all[name] || "" }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>, extra: Record<string, string> = {}) {
    e.preventDefault();
    if (state === "sending") return;
    const form = e.currentTarget;
    const data = { ...(Object.fromEntries(new FormData(form)) as Record<string, string>), ...extra };
    const r = schema.safeParse(data);
    if (!r.success) {
      const errs = toFieldErrors(r.error);
      setErrors(errs);
      // never fail silently: say something even if the problem is in a field without its own message
      setFormError("Please check the highlighted fields and try again.");
      const first = form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`);
      first?.focus();
      return;
    }
    setErrors({});
    setFormError("");
    setState("sending");
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        if (json.errors) setErrors(json.errors);
        setFormError(json.error || "Couldn't send right now. Check your connection and try again.");
        setState("failed");
        return;
      }
      setState("sent");
    } catch {
      setFormError("Couldn't send right now. Check your connection and try again.");
      setState("failed");
    }
  }

  const clearError = (name: string) => setErrors((e) => (e[name] ? { ...e, [name]: "" } : e));

  return { errors, state, formError, onSubmit, validateField, clearError };
}
