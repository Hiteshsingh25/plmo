"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onLoaderCue, prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP, DrawSVGPlugin, ScrollTrigger);

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  start?: string;
  end?: string;
  scrub?: number | boolean;
  stagger?: number | "sequential";
  from?: "start" | "center";
  order?: "length" | "dom";
  /** "scroll" draws on scroll; "loader" plays once after the preloader */
  trigger?: "scroll" | "loader";
  delay?: number;
  duration?: number;
};

/**
 * Wraps an inline SVG and draws every stroked shape in via DrawSVG.
 * Multi-subpath `d` attributes are split so each stroke draws in turn.
 */
export default function DrawSVG({
  children,
  className = "",
  start = "top 85%",
  end = "top 35%",
  scrub = 1,
  stagger = 0.08,
  from = "start",
  order = "length",
  trigger = "scroll",
  delay = 0,
  duration = 0.6,
  ...rest
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const svg = root.current?.querySelector("svg");
      if (!svg || !svg.getClientRects().length) return;
      const shapes = gsap.utils.toArray<SVGGeometryElement>(svg.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect"));
      if (!shapes.length) return;
      const stroked = shapes.filter((el) => {
        if (el.closest("defs, clipPath, mask")) return false;
        const s = gsap.getProperty(el, "stroke") as string;
        return s && s !== "none";
      });
      if (!stroked.length || prefersReducedMotion()) return;

      const targets: SVGGeometryElement[] = [];
      stroked.forEach((el) => {
        const d = el.getAttribute("d");
        const parts = d ? d.trim().split(/(?=M)/).filter((p) => p.trim()) : [];
        if (parts.length < 2) {
          targets.push(el);
          return;
        }
        const frag = document.createDocumentFragment();
        const clones = parts.map((p) => {
          const c = el.cloneNode(false) as SVGGeometryElement;
          c.setAttribute("d", p.trim());
          c.dataset.drawsvgSplit = "true";
          frag.appendChild(c);
          return c;
        });
        el.parentNode?.insertBefore(frag, el);
        el.style.display = "none";
        el.dataset.drawsvgSource = "true";
        targets.push(...clones);
      });
      const length = (el: SVGGeometryElement) => (typeof el.getTotalLength === "function" ? el.getTotalLength() : 0);
      if (order === "length") targets.sort((a, b) => length(b) - length(a));

      const loader = trigger === "loader";
      const tl = gsap.timeline({
        paused: loader,
        ...(loader ? {} : { scrollTrigger: { trigger: root.current, start, end, scrub } }),
      });
      const origin = from === "center" ? "50% 50%" : "0%";
      const hideUntil = (el: SVGGeometryElement, t: number) => {
        if (t <= 0) return;
        tl.set(el, { autoAlpha: 0 }, 0);
        tl.set(el, { autoAlpha: 1 }, t);
      };

      if (stagger === "sequential") {
        const lens = targets.map((el) => length(el) || 1);
        const total = lens.reduce((a, b) => a + b, 0) || 1;
        let at = 0;
        targets.forEach((el, i) => {
          const d = lens[i] / total;
          hideUntil(el, at);
          tl.fromTo(el, { drawSVG: origin }, { drawSVG: "100%", duration: d, ease: "none" }, at);
          at += d;
        });
      } else {
        const each = targets.length > 1 ? stagger : 0;
        const d = Math.max(0.05, 1 - each * (targets.length - 1));
        targets.forEach((el, i) => {
          hideUntil(el, each * i);
          tl.fromTo(el, { drawSVG: origin }, { drawSVG: "100%", duration: d, ease: "none" }, each * i);
        });
      }

      let offCue: (() => void) | null = null;
      if (loader) {
        tl.pause(0);
        gsap.set(root.current, { autoAlpha: 0 });
        offCue = onLoaderCue(
          () => {
            gsap.set(root.current, { autoAlpha: 1 });
            tl.timeScale(1 / duration).play(0);
          },
          { delay },
        );
      }

      return () => {
        offCue?.();
        targets.forEach((el) => {
          if (el.dataset.drawsvgSplit) el.remove();
          else gsap.set(el, { clearProps: "strokeDasharray,strokeDashoffset,opacity,visibility" });
        });
        stroked.forEach((el) => {
          if (el.dataset.drawsvgSource) {
            el.style.removeProperty("display");
            delete el.dataset.drawsvgSource;
          }
        });
        if (loader) gsap.set(root.current, { clearProps: "opacity,visibility" });
      };
    },
    { scope: root, dependencies: [start, end, scrub, stagger, from, order, trigger, delay, duration] },
  );

  return (
    <div ref={root} className={className} {...rest}>
      {children}
    </div>
  );
}
