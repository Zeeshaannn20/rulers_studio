"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import TLink from "./TLink";
import RMark, { Wordmark } from "./RMark";
import { Arrow } from "./Icons";
import { gsap, getLenis } from "@/lib/motion";
import { SITE } from "@/data/site";

// Header design: "editorial" | "agency" | "minimal"
export const HEADER_STYLE: "editorial" | "agency" | "minimal" = "editorial";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/join-the-crew", label: "Join the Crew" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const hdr = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  // Solid background after the top; hides on scroll down, returns on scroll up
  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const el = hdr.current;
      if (!el) return;
      el.classList.toggle("solid", y > 40 && !document.body.classList.contains("in-stage"));
      if (document.body.classList.contains("in-stage")) {
        el.classList.remove("hide");
        last = y;
        return;
      }
      if (y > last + 4 && y > 300) el.classList.add("hide");
      else if (y < last - 4) el.classList.remove("hide");
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu overlay animation (G-02)
  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    if (open) {
      gsap.set(el, { visibility: "visible" });
      gsap.to(el, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.inOut" });
      gsap.fromTo(el.querySelectorAll("nav a"), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: "expo.out", delay: 0.25 });
      getLenis()?.stop();
    } else {
      gsap.to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.6, ease: "expo.inOut", onComplete: () => { gsap.set(el, { visibility: "hidden" }); } });
      getLenis()?.start();
    }
  }, [open]);

  // a thin line slides under the current page and follows the pointer across the links
  useEffect(() => {
    const el = nav.current;
    if (!el) return;
    const ind = el.querySelector<HTMLElement>(".nav-ind")!;
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>("a"));
    const to = (a?: HTMLElement | null) => {
      if (!a) {
        ind.style.opacity = "0";
        return;
      }
      const lab = a.querySelector<HTMLElement>(".roll") || a;
      ind.style.opacity = "1";
      ind.style.width = lab.offsetWidth + "px";
      ind.style.transform = `translate3d(${lab.offsetLeft}px,0,0)`; // .roll is measured from the nav itself
    };
    const home = () => to(links.find((a) => a.getAttribute("aria-current") === "page"));
    home();
    const t = window.setTimeout(home, 600); // after the fonts settle
    const enter = (e: Event) => to(e.currentTarget as HTMLElement);
    links.forEach((a) => a.addEventListener("pointerenter", enter));
    el.addEventListener("pointerleave", home);
    window.addEventListener("resize", home);
    return () => {
      window.clearTimeout(t);
      links.forEach((a) => a.removeEventListener("pointerenter", enter));
      el.removeEventListener("pointerleave", home);
      window.removeEventListener("resize", home);
    };
  }, [pathname]);

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener("rs:close-menu", close);
    return () => document.removeEventListener("rs:close-menu", close);
  }, []);

  const current = (href: string) =>
    (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")) ? "page" : undefined;

  return (
    <>
      <header className="hdr" data-v={HEADER_STYLE} ref={hdr}>
        <div className="wrap">
          <TLink className="logo-l" href="/" aria-label="Rulers Studio home">
            <RMark />
            <Wordmark />
          </TLink>
          <span className="hdr-tag" aria-hidden="true">
            AI Studio
          </span>
          <nav className="nav" aria-label="Main" ref={nav}>
            {LINKS.map((l, i) => (
              <TLink key={l.href} href={l.href} aria-current={current(l.href)}>
                <em>{String(i + 1).padStart(2, "0")}</em>
                <span className="roll" data-t={l.label}>
                  <span>{l.label}</span>
                </span>
              </TLink>
            ))}
            <i className="nav-ind" aria-hidden="true" />
          </nav>
          <div className="hdr-r">
            <span className="hdr-status">
              <b /> Open for projects
            </span>
            <TLink href="/contact" className="hdr-link">
              <span className="roll" data-t="Start a project">
                <span>Start a project</span>
              </span>
              <Arrow />
            </TLink>
            <TLink href="/contact" className="btn solid sm hdr-cta">
              Start a project <Arrow />
            </TLink>
            <button className="menu-btn" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(true)}>
              Menu <i aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="menu" id="menu" ref={menu} role="dialog" aria-label="Menu" aria-hidden={!open}>
        <div className="top">
          <TLink className="logo-l" href="/">
            <RMark fill="#101010" />
            <Wordmark />
          </TLink>
          <button className="close" type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <nav aria-label="Menu links">
          <TLink href="/">Home</TLink>
          <TLink href="/projects">Projects</TLink>
          <TLink href="/join-the-crew">Join the Crew</TLink>
          <TLink href="/contact">Contact</TLink>
        </nav>
        <div className="foot">
          <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">@rulers.studio</a>
          <span>© 2026 Rulers Studio</span>
        </div>
      </div>
    </>
  );
}
