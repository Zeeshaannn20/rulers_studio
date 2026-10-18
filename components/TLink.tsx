"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { coverThen } from "@/lib/transition";

// Internal link that plays the curtain transition before navigating.
export default function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return;
    e.preventDefault();
    e.currentTarget.blur();
    document.dispatchEvent(new Event("rs:close-menu"));
    if (href === pathname) {
      window.scrollTo({ top: 0 });
      return;
    }
    // same page, different #section or ?query: the page doesn't change, so no loader
    const path = href.split(/[?#]/)[0] || pathname;
    if (path === pathname) return router.push(href, { scroll: true });
    coverThen(() => router.push(href, { scroll: true }));
  }

  return <Link href={href} onClick={handle} {...rest} />;
}
