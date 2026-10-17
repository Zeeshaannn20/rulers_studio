"use client";
import { useEffect, useId, useRef, useState } from "react";

// Themed dropdown (replaces the browser's native select menu so it matches the site).
// Keyboard: Enter/Space/↓ opens, ↑/↓ moves, Enter picks, Esc closes. Submits via a hidden input.
export default function Select({
  id,
  name,
  options,
  placeholder = "Select",
  onChange,
}: {
  id: string;
  name: string;
  options: string[];
  placeholder?: string;
  onChange?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function pick(v: string) {
    setValue(v);
    setOpen(false);
    onChange?.(v);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open && ["Enter", " ", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      setActive(Math.max(0, options.indexOf(value)));
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(options[active]); }
    else if (e.key === "Tab") setOpen(false);
  }

  return (
    <div className={"sel" + (open ? " open" : "")} ref={root}>
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        className={"sel-btn" + (value ? "" : " empty")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setActive(Math.max(0, options.indexOf(value)));
          setOpen((o) => !o);
        }}
        onKeyDown={onKey}
      >
        <span>{value || placeholder}</span>
        <svg className="sel-caret" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <ul className="sel-list" id={listId} role="listbox" aria-labelledby={id} hidden={!open}>
        {options.map((o, i) => (
          <li
            key={o}
            role="option"
            aria-selected={o === value}
            className={(i === active ? "act " : "") + (o === value ? "on" : "")}
            onPointerEnter={() => setActive(i)}
            onClick={() => pick(o)}
          >
            {o}
            {o === value && (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 7.5l3.2 3L12 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
