"use client";

import { useCallback, useEffect, useRef, type ButtonHTMLAttributes } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { onLoaderCue, prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  title?: string;
  /** play the draw-on intro once the loader clears */
  entry?: boolean;
  entryDelay?: number;
};

const OVAL =
  "M118.8 65.7551C118.8 65.7551 9.54145 66.2038 2.20331 40.1869C-5.73315 12.0488 55.2778 1.5 95.5383 1.5C135.799 1.5 195.672 4.08468 205.776 31.8674C219.086 68.4625 44.4656 72.5 44.4656 72.5";

/**
 * Patrick Hand label ringed by a hand-drawn oval. On hover the ring un-draws
 * while each letter flips to its twin underneath; on leave it redraws.
 */
export default function Button({ title = "Explore Flavors", className = "", entry = false, entryDelay = 0, ...rest }: Props) {
  const root = useRef<HTMLButtonElement>(null);
  const path = useRef<SVGPathElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const len = useRef(0);
  const words = title.split(" ");

  // Keep the stroke width visually constant regardless of the button's stretch.
  const measure = useCallback(() => {
    const p = path.current;
    const el = root.current;
    if (!p || !el) return;
    len.current = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len.current });
    const r = el.getBoundingClientRect();
    if (r.width && r.height) {
      const k = Math.sqrt((r.width / 208) * (r.height / 74));
      gsap.set(p, { strokeWidth: 3 / k });
    }
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useGSAP(
    () => {
      if (!entry) return;
      const el = root.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      gsap.set(el, { autoAlpha: 0 });
      return onLoaderCue(
        () => {
          if (path.current && len.current) gsap.set(path.current, { strokeDashoffset: len.current });
          const tl = gsap.timeline();
          tl.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", startAt: { y: 18 } });
          if (path.current) tl.to(path.current, { strokeDashoffset: 0, duration: 0.45, ease: "power2.inOut" }, "-=0.35");
        },
        { delay: entryDelay },
      );
    },
    { scope: root, dependencies: [entry, entryDelay] },
  );

  const onEnter = useCallback(() => {
    if (prefersReducedMotion()) return;
    gsap.killTweensOf(path.current, "opacity");
    gsap.to(path.current, { strokeDashoffset: len.current, duration: 0.5, ease: "power2.inOut", overwrite: "auto" });
    gsap.to(path.current, { opacity: 0, duration: 0.16, delay: 0.34, ease: "power2.in", overwrite: "auto" });
    gsap.to(letters.current.filter(Boolean), {
      yPercent: -50,
      duration: 0.575,
      ease: "expo.out",
      stagger: { each: 0.014, from: "start" },
      overwrite: "auto",
    });
  }, []);

  const onLeave = useCallback(() => {
    if (prefersReducedMotion()) return;
    gsap.killTweensOf(path.current, "opacity");
    gsap.to(path.current, { opacity: 1, duration: 0.14, ease: "power2.out", overwrite: "auto" });
    gsap.to(path.current, { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut", overwrite: "auto" });
    gsap.to(letters.current.filter(Boolean), {
      yPercent: 0,
      duration: 0.52,
      ease: "expo.out",
      stagger: { each: 0.0115, from: "end" },
      overwrite: "auto",
    });
  }, []);

  return (
    <button
      ref={root}
      type="button"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      aria-label={title}
      className={`relative inline-flex cursor-pointer items-center justify-center text-foreground will-change-transform ${className}`}
      {...rest}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 208 74" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path ref={path} d={OVAL} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span
        aria-hidden="true"
        className="font-patrick-hand relative z-1 flex gap-[0.3em] px-[1.5vw] py-[0.8vw] pb-[1vw]! text-[1.3rem] leading-[1.2] tracking-[-0.04em] whitespace-nowrap max-md:px-6 max-md:py-3 max-md:pb-3.5!"
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline-flex">
            {Array.from(word).map((ch, ci) => {
              const idx = words.slice(0, wi).reduce((a, w) => a + w.length, 0) + ci;
              return (
                <span key={ci} className="relative inline-block h-[1.55em] -my-[0.175em] overflow-hidden align-bottom">
                  <span
                    ref={(el) => {
                      letters.current[idx] = el;
                    }}
                    className="flex flex-col leading-[1.55] will-change-transform"
                  >
                    <span>{ch}</span>
                    <span>{ch}</span>
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </button>
  );
}
