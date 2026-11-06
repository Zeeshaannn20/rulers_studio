"use client";
import { useEffect, useState } from "react";
import { SITE } from "@/data/site";
import { track } from "@/lib/fbq";

const TEXT = "Hi Rulers Studio, I'd like to talk about a film.";

// Floating WhatsApp button, bottom right. It stays out of the way on the opening screen and
// while the Selected work section is pinned (its counter sits in that corner).
export default function WhatsAppButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let inWork = false;
    const update = () => setShow(window.scrollY > window.innerHeight * 0.6 && !inWork && !document.body.classList.contains("intro-on"));
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (inWork = e.isIntersecting));
      update();
    }, { threshold: 0.35 });
    const watch = () => {
      io.disconnect();
      document.querySelectorAll(".wt").forEach((el) => io.observe(el));
    };
    watch();
    // pages change without a reload, so look for the section again when the page content changes
    const mo = new MutationObserver(() => { inWork = false; watch(); update(); });
    const main = document.getElementById("main");
    if (main) mo.observe(main, { childList: true });
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <a
      className={"wa-fab" + (show ? " on" : "")}
      href={`${SITE.whatsapp}?text=${encodeURIComponent(TEXT)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      tabIndex={show ? 0 : -1}
      onClick={() => track("Contact", { method: "whatsapp" })}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.04 3C9.4 3 4 8.35 4 14.94c0 2.1.56 4.16 1.62 5.97L4 29l8.3-2.15a12.1 12.1 0 0 0 3.74.6h.01C22.68 27.45 28 22.1 28 15.5 28 8.9 22.68 3 16.04 3Zm0 21.97h-.01c-1.18 0-2.34-.3-3.36-.86l-.24-.14-4.93 1.28 1.32-4.75-.16-.25a9.6 9.6 0 0 1-1.5-5.1c0-5.3 4.36-9.6 9.72-9.6 5.34 0 9.6 4.45 9.6 9.95 0 5.3-4.35 9.47-9.44 9.47Zm5.3-7.1c-.29-.15-1.72-.85-1.99-.94-.27-.1-.46-.15-.66.14-.2.3-.76.94-.93 1.13-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.58-.9-2.16-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.2 3.01.14.2 2.06 3.12 4.99 4.38.7.3 1.24.48 1.66.61.7.22 1.34.19 1.84.12.56-.08 1.72-.7 1.97-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.34Z" />
      </svg>
      <span className="wa-tip">Chat on WhatsApp</span>
    </a>
  );
}
