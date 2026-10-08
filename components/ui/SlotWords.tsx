"use client";

import { useRef, type CSSProperties, type HTMLAttributes } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Word = string | { text: string; className?: string };

type Props = HTMLAttributes<HTMLSpanElement> & {
  words: Word[];
  wordClassName?: string;
  textScale?: number;
  gap?: number;
  lift?: number;
  opticalShift?: number;
  height?: number;
  start?: string;
  end?: string;
  scrub?: number;
};

/** Inline slot-machine word that flips through highlighted alternatives on scroll. */
export default function SlotWords({
  words,
  className = "",
  wordClassName = "px-[0.22em] rounded-[0.1em]",
  textScale = 0.72,
  gap = 1,
  lift = 0.06,
  opticalShift = 0.06,
  height = 0.8,
  start = "top 80%",
  end = "top 35%",
  scrub = 0.6,
  style,
  ...rest
}: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const items = words.map((w) => (typeof w === "string" ? { text: w, className: "" } : w));

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const slots = gsap.utils.toArray<HTMLElement>(".slot-word", el);
      if (slots.length < 2) return;
      if (prefersReducedMotion()) {
        gsap.set(slots, { y: 0, autoAlpha: 0 });
        gsap.set(slots[slots.length - 1], { autoAlpha: 1 });
        return;
      }
      let tl: gsap.core.Timeline | null = null;
      let lastW = window.innerWidth;
      let t: ReturnType<typeof setTimeout> | null = null;
      const build = () => {
        if (tl) {
          tl.scrollTrigger?.kill();
          tl.kill();
          tl = null;
        }
        const g = (window.innerWidth * gap) / 100;
        const step = slots[0].offsetHeight + g;
        const travel = (slots.length - 1) * step;
        slots.forEach((s, i) => gsap.set(s, { y: i * step }));
        tl = gsap
          .timeline({
            scrollTrigger: { trigger: el, start, end, scrub, snap: { snapTo: 1 / (slots.length - 1), duration: 0.2, ease: "power1.inOut" } },
            defaults: { ease: "none" },
          })
          .to(slots, { y: (i) => i * step - travel, duration: 1, ease: "none" });
      };
      build();
      const onResize = () => {
        const w = window.innerWidth;
        if (w === lastW) return;
        lastW = w;
        if (t) clearTimeout(t);
        t = setTimeout(() => {
          build();
          ScrollTrigger.refresh();
        }, 150);
      };
      const rebuild = () => {
        build();
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      window.addEventListener("loaderComplete", rebuild);
      window.addEventListener("pageTransitionComplete", rebuild);
      return () => {
        if (t) clearTimeout(t);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
        window.removeEventListener("loaderComplete", rebuild);
        window.removeEventListener("pageTransitionComplete", rebuild);
        tl?.scrollTrigger?.kill();
        tl?.kill();
      };
    },
    { scope: root, dependencies: [items.map((i) => i.text).join("|"), start, end, scrub, gap, height, textScale, opticalShift, lift] },
  );

  return (
    <span
      ref={root}
      className={`relative inline-block overflow-hidden align-middle isolate ${className}`}
      {...rest}
      style={{ height: `${height}em`, lineHeight: `${height}em`, position: "relative", top: `-${lift}em`, ...style } as CSSProperties}
    >
      <span className="grid">
        {items.map((w, i) => (
          <span
            key={w.text + i}
            className={`slot-word col-start-1 row-start-1 flex items-center justify-center leading-none whitespace-nowrap will-change-transform ${wordClassName} ${w.className ?? ""}`}
            style={{ height: `${height}em`, ...(i === 0 ? null : { transform: `translateY(calc(${i} * (${height}em + ${gap}vw)))` }) }}
            aria-hidden={i !== items.length - 1 || undefined}
          >
            <span className="block" style={{ fontSize: `${textScale}em`, lineHeight: 1, transform: `translateY(${opticalShift}em)` }}>
              {w.text}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
