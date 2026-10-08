"use client";

import { useEffect, useRef, useState } from "react";

/** "SLASH ACTIVATED — swipe to slice" flash, shown once when a slash zone first scrolls in. */
export default function SlashBanner() {
  const [show, setShow] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let io: IntersectionObserver | undefined;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const arm = setTimeout(() => {
      const zones = document.querySelectorAll("[data-slash-zone]");
      if (!zones.length) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio > 0.15 && !fired.current) {
              fired.current = true;
              setShow(true);
              hide = setTimeout(() => setShow(false), 2400);
              io?.disconnect();
            }
          }
        },
        { threshold: [0, 0.15, 0.5] },
      );
      zones.forEach((z) => io!.observe(z));
    }, 100);
    return () => {
      clearTimeout(arm);
      if (hide) clearTimeout(hide);
      io?.disconnect();
    };
  }, []);

  if (!show) return null;
  return (
    <div aria-hidden="true" className="slash-banner pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
      <span className="slash-scrim" />
      <span className="slash-line" />
      <div className="slash-stack relative flex flex-col items-center">
        <span className="relative block">
          <span className="slash-word slash-word--top font-khand">Slash Activated</span>
          <span className="slash-word slash-word--bottom font-khand">Slash Activated</span>
        </span>
        <span className="slash-sub font-inter">Swipe to slice</span>
      </div>
    </div>
  );
}
