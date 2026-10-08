"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";

const KEY = "palmo_cookie_ok";

const Flip = ({ children }: { children: ReactNode }) => (
  <span className="relative inline-flex overflow-hidden">
    <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">{children}</span>
    <span aria-hidden className="absolute left-0 top-full inline-block transition-transform duration-300 group-hover:-translate-y-full">
      {children}
    </span>
  </span>
);

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ok = false;
    try {
      ok = window.localStorage.getItem(KEY) === "1";
    } catch {}
    if (ok) return;
    const t = setTimeout(() => {
      setMounted(true);
      setShow(true);
    }, 4500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (show) {
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 0, y: 45, scale: 0.98, pointerEvents: "auto" });
      gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power4.out" });
    } else if (mounted) {
      gsap.killTweensOf(el);
      gsap.to(el, { opacity: 0, y: 45, scale: 0.98, duration: 0.45, ease: "power2.inOut", onComplete: () => setMounted(false) });
    }
  }, [show, mounted]);

  if (!mounted) return null;

  return (
    <aside className="fixed bottom-6 max-md:bottom-4 left-1/2 -translate-x-1/2 z-900 w-auto max-w-[90vw] pointer-events-none select-none font-patrick-hand" role="dialog" aria-label="Cookie consent banner">
      <div ref={box} className="pointer-events-auto h-11 max-md:h-auto flex items-center justify-between gap-3 bg-background/95 backdrop-blur-md text-foreground border border-foreground/20 rounded-md shadow-xl px-3 py-1.5 max-md:flex-col max-md:items-start max-md:p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-beige text-foreground border border-foreground/15">
            <svg aria-hidden="true" className="size-4 shrink-0 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
          </span>
          <p className="text-sm text-foreground/85 whitespace-nowrap max-md:whitespace-normal leading-none">We use cookies to improve your experience.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 max-md:w-full max-md:justify-end">
          <button type="button" onClick={() => setShow(false)} className="group cursor-pointer uppercase tracking-wider text-xs px-2.5 h-7 rounded-md text-foreground/70 hover:text-foreground hover:bg-light-beige/50 transition-colors duration-200 flex items-center justify-center">
            <Flip>Later</Flip>
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.setItem(KEY, "1");
              } catch {}
              setShow(false);
            }}
            className="group cursor-pointer uppercase tracking-wider text-xs px-3.5 h-7 rounded-md bg-beige border border-foreground/20 text-foreground hover:bg-foreground hover:text-beige hover:border-foreground transition-colors duration-200 shadow-xs font-semibold flex items-center justify-center"
          >
            <Flip>Okay!</Flip>
          </button>
        </div>
      </div>
    </aside>
  );
}
