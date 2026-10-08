"use client";

import { createElement, useRef, type HTMLAttributes, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

let refreshQueued = false;
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      refreshQueued = false;
      ScrollTrigger.refresh();
    }),
  );
}

type Props = HTMLAttributes<HTMLElement> & {
  as?: keyof HTMLElementTagNameMap;
  variant?: "heading" | "paragraph";
  children: ReactNode;
  delay?: number;
  stagger?: number;
  from?: "start" | "end" | "center";
  duration?: number;
  start?: string;
  maskPad?: string;
};

/**
 * Masked reveal. Headings split to chars (yPercent 140 → 0, power3), paragraphs
 * to lines. Waits for the loader / page-transition before it can fire, then
 * reverts SplitText once done so the DOM is clean again.
 */
export default function AnimatedText({
  as = "span",
  variant,
  children,
  className = "",
  delay = 0,
  stagger,
  from = "start",
  duration,
  start = "top 88%",
  maskPad,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const isHeading = ["h1", "h2", "h3", "h4", "h5", "h6"].includes(as);
  const mode = variant || (isHeading ? "heading" : "paragraph");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      let split: SplitText | null = null;
      let tween: gsap.core.Tween | null = null;
      let completed = false;

      const build = () => {
        if (completed) return null;
        const chars = mode === "heading";
        split = SplitText.create(el, { type: chars ? "lines,words,chars" : "lines,words", mask: "lines" });
        if (chars && maskPad) split.masks?.forEach((m) => gsap.set(m, { paddingLeft: maskPad, paddingRight: maskPad }));
        const targets = chars ? split.chars : split.lines;
        gsap.set(targets, chars ? { yPercent: 140 } : { yPercent: 140, opacity: 0 });
        gsap.set(el, { autoAlpha: 1 });
        tween = gsap.to(targets, {
          yPercent: 0,
          ...(chars ? {} : { opacity: 1 }),
          duration: duration || (chars ? 0.85 : 0.8),
          ease: chars ? "power3.out" : "power2.out",
          stagger: { each: stagger || (chars ? 0.035 : 0.08), from },
          delay,
          scrollTrigger: { trigger: el, start, once: true },
          onComplete: () => {
            completed = true;
            split?.revert();
            split = null;
            gsap.set(el, { autoAlpha: 1, clearProps: "transform" });
          },
        });
        return () => {
          tween?.scrollTrigger?.kill();
          tween?.kill();
          tween = null;
          split?.revert();
          split = null;
        };
      };

      let teardown: (() => void) | null = null;
      let started = false;
      let lastW = window.innerWidth;
      let resizeT: ReturnType<typeof setTimeout> | null = null;
      const go = () => {
        if (started) return;
        started = true;
        teardown = build();
        queueRefresh();
      };
      const onResize = () => {
        if (completed) return;
        const w = window.innerWidth;
        if (w === lastW) return;
        lastW = w;
        if (!started) return;
        if (resizeT) clearTimeout(resizeT);
        resizeT = setTimeout(() => {
          if (completed) return;
          teardown?.();
          teardown = build();
          queueRefresh();
        }, 150);
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);

      const loaderPending = !!document.getElementById("loader") && !window.__loaderFinished;
      const transitionPending = !!window.__pageTransitionActive;
      let poll: ReturnType<typeof setInterval> | null = null;
      if (loaderPending || transitionPending) {
        if (loaderPending) window.addEventListener("loaderComplete", go);
        if (transitionPending) window.addEventListener("pageTransitionComplete", go);
        poll = setInterval(() => {
          const l = !window.__loaderFinished && document.getElementById("loader");
          if (!l && !window.__pageTransitionActive) {
            if (poll) clearInterval(poll);
            go();
          }
        }, 150);
      } else go();

      return () => {
        if (poll) clearInterval(poll);
        if (resizeT) clearTimeout(resizeT);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
        window.removeEventListener("loaderComplete", go);
        window.removeEventListener("pageTransitionComplete", go);
        teardown?.();
      };
    },
    { scope: ref, dependencies: [delay, duration, stagger, from, start, mode, maskPad] },
  );

  return createElement(as, { ref, className: `invisible ${className}`, ...rest }, children);
}

export const AnimatedHeading = ({ as = "h2", ...p }: Props) => <AnimatedText as={as} variant="heading" {...p} />;
export const AnimatedParagraph = ({ as = "p", ...p }: Props) => <AnimatedText as={as} variant="paragraph" {...p} />;
