"use client";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, TOP_COUNT, DEFAULT_CC, countryByIso, countryFromIntl, flagOf, type Country } from "@/lib/countries";
import { normalisePhone } from "@/lib/validation";

// Phone number box with a country picker in front of it. India (+91) is the default.
// The picked country goes to the server as a hidden "<name>Cc" field, so the right rules are used.
// Pasting "+44 7911 123456" switches the country to the UK by itself.
export default function PhoneField({
  id,
  name,
  invalid,
  onBlur,
}: {
  id: string;
  name: string;
  invalid?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  const [cc, setCc] = useState<Country>(countryByIso(DEFAULT_CC)!);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const num = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/^\+/, "");
    if (!t) return COUNTRIES;
    const seen = new Set<string>();
    return COUNTRIES.filter((c) => {
      if (seen.has(c.iso)) return false;
      const hit = c.name.toLowerCase().includes(t) || c.dial.startsWith(t) || c.iso.toLowerCase() === t;
      if (hit) seen.add(c.iso);
      return hit;
    });
  }, [q]);

  // open upward when there's no room below (same rule as the budget dropdown)
  useLayoutEffect(() => {
    if (!open || !root.current || !pop.current) return;
    const box = root.current.getBoundingClientRect();
    let top = 0;
    let bottom = window.innerHeight;
    for (let el = root.current.parentElement; el && el !== document.body; el = el.parentElement) {
      const o = getComputedStyle(el);
      if (/(hidden|clip|auto|scroll)/.test(o.overflow + o.overflowY)) {
        const r = el.getBoundingClientRect();
        top = Math.max(top, r.top);
        bottom = Math.min(bottom, r.bottom);
      }
    }
    const need = pop.current.offsetHeight + 16;
    setUp(bottom - box.bottom < need && box.top - top > bottom - box.bottom);
    search.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  // keep the highlighted row in view while using the arrow keys
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function pick(c: Country) {
    setCc(c);
    setOpen(false);
    setQ("");
    // re-clean what's already typed for the new country's rules
    if (num.current) num.current.value = clean(num.current.value, c);
    requestAnimationFrame(() => num.current?.focus());
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(shown.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (shown[active]) pick(shown[active]); }
    else if (e.key === "Tab") setOpen(false);
  }

  // India keeps the strict 10 digits; elsewhere digits only, up to 15.
  const clean = (v: string, c: Country) => (c.iso === "IN" ? normalisePhone(v) : v.replace(/\D/g, "").slice(0, 15));

  function onInput(e: React.FormEvent<HTMLInputElement>) {
    const t = e.currentTarget;
    const raw = t.value.trim();
    // a pasted international number picks its own country
    if (raw.startsWith("+") || raw.startsWith("00")) {
      const d = raw.replace(/\D/g, "").replace(/^00/, "");
      const found = countryFromIntl(d);
      if (found && d.length > found.dial.length + 3) {
        setCc(found);
        t.value = clean(d.slice(found.dial.length), found);
        return;
      }
      if (raw === "+" || raw === "00") return; // still typing the code
    }
    const v = clean(t.value, cc);
    if (t.value !== v) t.value = v;
  }

  const isIndia = cc.iso === "IN";

  return (
    <div className={"phone" + (open ? " open" : "")} ref={root}>
      <input type="hidden" name={name + "Cc"} value={cc.iso} />
      <button
        type="button"
        className="cc-btn"
        aria-label={`Country code: ${cc.name} +${cc.dial}. Change country`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setActive(Math.max(0, COUNTRIES.findIndex((c) => c.iso === cc.iso)));
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (!open && e.key === "ArrowDown") { e.preventDefault(); setOpen(true); }
        }}
      >
        <span className="cc-flag" aria-hidden="true">{flagOf(cc.iso)}</span>
        <span className="cc-dial">+{cc.dial}</span>
        <svg className="cc-chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
      </button>
      <input
        ref={num}
        id={id}
        name={name}
        type="tel"
        inputMode={isIndia ? "numeric" : "tel"}
        autoComplete={isIndia ? "tel-national" : "tel"}
        placeholder={isIndia ? "98765 43210" : "Phone number"}
        maxLength={20}
        onInput={onInput}
        onBlur={onBlur}
        aria-invalid={invalid}
      />
      {open && (
        <div className={"cc-pop" + (up ? " up" : "")} ref={pop} onKeyDown={onListKey}>
          <input
            ref={search}
            className="cc-search"
            type="text"
            placeholder="Search country or code"
            aria-label="Search country or code"
            aria-controls={listId}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
          />
          <ul className="cc-list" id={listId} role="listbox" ref={list} data-lenis-prevent>
            {shown.map((c, i) => (
              <li
                key={c.iso + i}
                data-i={i}
                role="option"
                aria-selected={c.iso === cc.iso}
                className={(i === active ? "act" : "") + (c.iso === cc.iso ? " on" : "") + (!q && i === TOP_COUNT - 1 ? " sep" : "")}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(c)}
              >
                <span className="cc-flag" aria-hidden="true">{flagOf(c.iso)}</span>
                <span className="cc-name">{c.name}</span>
                <span className="cc-code">+{c.dial}</span>
              </li>
            ))}
            {!shown.length && <li className="cc-none">No match. Try a country name or code.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
