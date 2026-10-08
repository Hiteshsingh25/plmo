"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { useCart } from "@/lib/cart";
import { onLoaderCue, prefersReducedMotion } from "@/lib/events";
import { TransitionLink, usePageTransition } from "@/components/providers/PageTransition";
import PalmTree from "@/components/ui/PalmTree";

gsap.registerPlugin(useGSAP);

export const EMAIL = "hello@palmo.co.in";
export const NAV = [
  { label: "Home", href: "/" },
  { label: "Story", href: "/story" },
  { label: "Flavours", href: "/flavours" },
  { label: "Benefits", href: "/#benefits" },
  { label: "Contact", href: "/#cta" },
];

/* ── full-screen menu ───────────────────────────────────────────────── */
function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const links = useRef<(HTMLSpanElement | null)[]>([]);
  const extras = useRef<(HTMLDivElement | null)[]>([]);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lenis = useLenis();
  const { transitionTo } = usePageTransition();

  useGSAP(
    () => {
      const t = gsap.timeline({ paused: true });
      t.set(root.current, { autoAlpha: 1 })
        .fromTo(root.current, { clipPath: "ellipse(75% 0% at 50% -5%)" }, { clipPath: "ellipse(105% 145% at 50% -5%)", duration: 1, ease: "power3.inOut" })
        .fromTo(links.current, { yPercent: 165, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 0.75, ease: "power3.out", stagger: 0.06 }, "-=0.45")
        .fromTo(extras.current, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power2.out", stagger: 0.08 }, "-=0.5");
      tl.current = t;
    },
    { scope: root },
  );

  useGSAP(
    () => {
      const t = tl.current;
      if (!t) return;
      if (open) {
        lenis?.stop();
        t.timeScale(1).play();
      } else {
        lenis?.start();
        t.timeScale(1.4).reverse();
      }
    },
    { dependencies: [open, lenis] },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (copiedT.current) clearTimeout(copiedT.current);
    copiedT.current = setTimeout(() => setCopied(false), 2000);
  };

  // focus trap + escape
  useEffect(() => {
    if (!open) return;
    const el = root.current;
    if (!el) return;
    const sel = 'a, button, [tabindex]:not([tabindex="-1"])';
    (el.querySelector(sel) as HTMLElement | null)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(sel));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      ref={root}
      aria-hidden={!open}
      className={`fixed inset-0 z-800 bg-foreground text-light-beige ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      style={{ clipPath: "ellipse(75% 0% at 50% -5%)", visibility: "hidden" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[-15vw] size-[60vw] -translate-x-1/2 rounded-full opacity-25 blur-[8vw]" style={{ background: "radial-gradient(circle, var(--gold), transparent 70%)" }} />
        <PalmTree interactive={open} intensity={1.4} className="absolute bottom-[-10vw] max-md:bottom-[-14vh] left-1/2 w-[60vw] max-md:w-[210vw] -translate-x-1/2 max-md:-translate-x-[57%] opacity-10" />
      </div>
      <div className="paddx relative z-10 flex h-full w-full flex-col items-center justify-between py-[6vw] max-md:py-[8vh]">
        <nav className="flex flex-1 flex-col items-center justify-center">
          {NAV.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onClose();
                gsap.delayedCall(0.4, () => transitionTo(item.href));
              }}
              tabIndex={open ? 0 : -1}
              className="group flex justify-center overflow-hidden px-[0.5vw] pb-[0.18em] pt-[0.04em] [margin-block:-0.13em]"
              style={{ fontSize: "min(8vw, 13vh)" }}
              data-menu-link="true"
            >
              <span
                ref={(el) => {
                  links.current[i] = el;
                }}
                className="block"
              >
                <span className="relative block whitespace-nowrap text150" style={{ fontSize: "inherit", lineHeight: 1 }}>
                  <span className="block">{item.label}</span>
                  <span aria-hidden className="absolute inset-0 block text-background [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:[clip-path:inset(0_0_0_0)]">
                    {item.label}
                  </span>
                </span>
              </span>
            </a>
          ))}
        </nav>
        <div
          ref={(el) => {
            extras.current[0] = el;
          }}
          className="flex w-full flex-col items-center gap-[0.2vw] max-md:gap-1"
        >
          <p className="text36 font-patrick-hand text-beige">Say hello</p>
          <div className="flex items-center gap-[0.8vw] max-md:gap-2">
            <a href={`mailto:${EMAIL}`} tabIndex={open ? 0 : -1} className="text32 transition-colors duration-300 hover:text-beige">
              {EMAIL}
            </a>
            <button
              type="button"
              onClick={copy}
              tabIndex={open ? 0 : -1}
              aria-label={copied ? "Email copied" : `Copy ${EMAIL}`}
              className={`group relative flex size-[2vw] max-md:size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-all duration-300 active:scale-90 ${
                copied ? "border-beige bg-beige text-foreground" : "border-light-beige/40 text-light-beige hover:border-beige hover:bg-light-beige hover:text-foreground"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`absolute size-[1.1vw] max-md:size-4 transition-all duration-300 ${copied ? "scale-50 opacity-0" : "scale-100 opacity-100"}`} aria-hidden>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`absolute size-[1.1vw] max-md:size-4 transition-all duration-300 ${copied ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span
                className={`pointer-events-none absolute bottom-[calc(100%+0.5vw)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-beige px-[0.6vw] py-[0.2vw] font-patrick-hand text-foreground transition-all duration-300 ${
                  copied ? "translate-y-0 opacity-100" : "translate-y-[0.4vw] opacity-0"
                }`}
                style={{ fontSize: "min(0.9rem, 2vh)" }}
              >
                Copied!
              </span>
            </button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? "Email copied to clipboard" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── dark-section detection for the pills ───────────────────────────── */
function useNavDark(band = 0) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const offsets = (el: Element): [number, number] => {
      const v = el.getAttribute("data-nav-dark");
      if (!v) return [0, 0];
      const [a, b] = v.trim().split(/\s+/).map(Number);
      return Number.isFinite(a) ? [a, Number.isFinite(b) ? b : a] : [0, 0];
    };
    const active = new Set<Element>();
    let last: boolean | null = null;
    const check = () => {
      const probe = 0.5 * (band || document.querySelector("nav.fixed")?.getBoundingClientRect().height || 72);
      const vw = window.innerWidth / 100;
      let hit = false;
      for (const el of active) {
        const r = el.getBoundingClientRect();
        const [top, bottom] = offsets(el);
        if (r.top + top * vw <= probe && r.bottom - bottom * vw > probe) {
          hit = true;
          break;
        }
      }
      if (hit !== last) {
        last = hit;
        setDark(hit);
      }
    };
    const els = document.querySelectorAll("[data-nav-dark]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) active.add(e.target);
          else active.delete(e.target);
        }
      },
      { threshold: 0, rootMargin: "100px 0px 0px 0px" },
    );
    els.forEach((el) => io.observe(el));
    gsap.ticker.add(check);
    check();
    return () => {
      io.disconnect();
      gsap.ticker.remove(check);
    };
  }, [band]);
  return dark;
}

/* ── header ─────────────────────────────────────────────────────────── */
export default function Header() {
  const [open, setOpen] = useState(false);
  const { count, ready, openCart, lastAdded } = useCart();
  const badge = useRef<HTMLParagraphElement>(null);
  const nav = useRef<HTMLElement>(null);
  const dark = useNavDark() || open;

  useLayoutEffect(() => {
    const el = nav.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { yPercent: 0 });
      return;
    }
    gsap.set(el, { yPercent: -120 });
    return onLoaderCue(() => {
      gsap.to(el, { yPercent: 0, duration: 0.85, ease: "power3.out" });
    }, { delay: 0.35 });
  }, []);

  useEffect(() => {
    if (lastAdded && badge.current) {
      gsap.fromTo(badge.current, { scale: 1 }, { scale: 1.3, duration: 0.22, ease: "sine.out", yoyo: true, repeat: 1 });
    }
  }, [lastAdded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Menu open={open} onClose={() => setOpen(false)} />
      <nav ref={nav} className="fixed top-0 paddx flex overflow-x-hidden gap-[1vw] items-center justify-between py-[1.5vw] left-0 w-full z-900 max-md:py-4">
        <TransitionLink href="/" aria-label="Home" className={`size-[4vw] max-md:size-11 flex items-center justify-center transition-colors duration-500 ${dark ? "text-light-beige" : "text-foreground"}`}>
          <svg viewBox="0 0 554 588" fill="none" xmlns="http://www.w3.org/2000/svg" className="block size-full overflow-visible" aria-hidden>
            <g clipPath="url(#nav-palm-clip)">
              <path d="M277.092 287.522L245.263 399.581L218.361 390.494L239.606 419.495L201.243 554.522C168.118 513.043 154.848 454.355 170.874 397.958C186.897 341.53 228.253 301.325 277.092 287.522Z" fill="currentColor" />
              <path d="M103.415 239.474C157.405 208.979 218.871 215.871 273.502 251.532L111.253 343.181L93.7865 296.4L90.1138 355.127L2.44079e-05 406.036C13.6111 331.805 49.4243 269.968 103.415 239.474Z" fill="currentColor" />
              <path d="M208.565 133.999L163.197 163.698L124.48 138.82L144.267 92.6644L98.9187 122.376L18.5067 70.6849C67.6015 28.2433 133.909 20.2124 190.768 56.7573C247.628 93.3141 279.895 164.727 279.238 238.309L188.778 180.141L208.565 133.999Z" fill="currentColor" />
              <path d="M396.393 71.7699L422.723 105.798L302.498 245.312C288.192 180.678 303.813 106.961 347.994 55.7056C392.172 4.43934 453.144 -10.6948 505.07 10.2686L442.601 82.755L396.393 71.7699Z" fill="currentColor" />
              <path d="M449.012 222.22C500.592 240.23 537.353 290.902 548.572 350.682L490.342 330.346L481.041 295.881L474.335 324.775L422.226 306.586L411.391 266.372L403.553 300.076L309.091 267.121C344.373 223.573 397.414 204.232 449.012 222.22Z" fill="currentColor" />
              <path d="M304.516 289.092L319.911 283.862C395.457 361.945 393.499 553.082 393.499 553.082L337.396 540.843C362.958 447.172 314.664 307.33 304.516 289.092Z" fill="currentColor" />
            </g>
            <defs>
              <clipPath id="nav-palm-clip">
                <rect width="553.217" height="587.272" fill="white" transform="matrix(-1 0 0 1 553.217 0)" />
              </clipPath>
            </defs>
          </svg>
        </TransitionLink>
        <div className="w-fit gap-[.5vw] max-md:gap-2 flex items-center justify-center cursor-pointer">
          <button
            type="button"
            onClick={openCart}
            aria-label={ready && count > 0 ? `Open basket, ${count} items` : "Open basket"}
            className={`rounded-md relative size-[2.5vw] max-md:size-10 flex items-center justify-center p-[0.45vw] max-md:p-2 cursor-pointer transition-all duration-300 active:scale-90 ${
              dark ? "bg-light-beige text-foreground" : "bg-foreground text-light-beige hover:bg-light-beige hover:text-foreground"
            }`}
          >
            {ready && count > 0 && (
              <p
                ref={badge}
                className={`text-[.6vw] max-md:text-[10px] border rounded-full size-[1.2vw] max-md:size-5 flex items-center justify-center absolute top-[-.5vw] left-[-.5vw] max-md:top-[-8px] max-md:left-[-8px] transition-colors duration-300 ${
                  dark ? "bg-foreground border-light-beige text-light-beige" : "bg-light-beige border-foreground text-foreground"
                }`}
              >
                {count > 9 ? "9+" : count}
              </p>
            )}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-full transition-all duration-300" aria-hidden>
              <path
                fill="currentColor"
                d="M2.9,9C3,9,3.1,9,3.2,9c0.2,0,0.4-0.1,0.6-0.2l0.4-0.3C4.1,8.8,3.9,9,3.8,9.3c0,0,0,0,0,0c-0.4,0.8-0.6,1.7-0.7,2.6c0,0,0,0,0,0c0,0,0,0,0,0C3,12.3,3,12.6,3,13c0,5,4,9,9,9s9-4,9-9c0-0.4,0-0.7-0.1-1.1c-0.2-1.2-0.5-2.4-1.1-3.4C19.6,8.2,19.3,8,18.9,8h-3.5l1.2-2.8L19.8,6c0.5,0.1,1.1-0.2,1.2-0.7c0.1-0.5-0.2-1.1-0.7-1.2l-4-1c-0.5-0.1-1,0.1-1.2,0.6L13.2,8H8.4L6.9,6.5l1.5-1.1c0.3-0.2,0.4-0.5,0.4-0.8c0-0.3-0.1-0.6-0.4-0.8C7.7,3.3,6.9,3,6,3C3.8,3,2,4.8,2,6.9c0,0.5,0.1,1,0.3,1.5C2.4,8.7,2.6,8.9,2.9,9z M19,13c0,3.9-3.1,7-7,7s-7-3.1-7-7H19z M18.3,10c0.2,0.3,0.3,0.7,0.4,1H5.3c0.1-0.3,0.2-0.7,0.4-1H18.3z M5.1,8C5,8,4.9,8,4.9,8l0.4-0.3L5.6,8H5.1z M5.5,5.1L4.2,6C4.5,5.5,5,5.2,5.5,5.1z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={`text36 relative px-[2vw] py-[.3vw] max-md:px-5 max-md:py-2 font-patrick-hand rounded-md cursor-pointer overflow-hidden transition-colors duration-300 ${
              dark ? "bg-light-beige text-foreground" : "bg-foreground text-light-beige"
            }`}
          >
            <span className="grid">
              <span className={`col-start-1 row-start-1 transition-all duration-400 ${open ? "translate-y-[-130%] opacity-0" : "translate-y-0 opacity-100"}`}>MENU</span>
              <span className={`col-start-1 row-start-1 transition-all duration-400 ${open ? "translate-y-0 opacity-100" : "translate-y-[130%] opacity-0"}`}>CLOSE</span>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
