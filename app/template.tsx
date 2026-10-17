"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { uncover } from "@/lib/transition";

// Lifts the page-transition curtain whenever the page changes. Keyed on the address, because
// moving between pages under the same section (e.g. /projects → /projects/amul) doesn't re-mount this.
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    uncover();
  }, [pathname]);
  return <>{children}</>;
}
