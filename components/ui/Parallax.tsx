"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP);

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  speed?: number;
  axis?: "x" | "y";
  rotate?: number;
};

/** Lenis-driven parallax: element drifts (and optionally spins) relative to its viewport position. */
export default function Parallax({ children, className = "", speed = 0.2, axis = "y", rotate = 0, ...rest }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const setters = useRef<{ move: (v: number) => void; spin: ((v: number) => void) | null } | null>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        setters.current = null;
        return;
      }
      setters.current = {
        move: gsap.quickSetter(el, axis === "x" ? "x" : "y", "px") as (v: number) => void,
        spin: rotate ? (gsap.quickSetter(el, "rotation", "deg") as (v: number) => void) : null,
      };
      return () => {
        setters.current = null;
        gsap.set(el, { clearProps: "transform" });
      };
    },
    { scope: root, dependencies: [axis, rotate, speed] },
  );

  useLenis(() => {
    const el = root.current;
    const s = setters.current;
    if (!el || !s) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = 1 - ((r.top + r.height / 2) / vh) * 2;
    s.move(p * vh * speed);
    s.spin?.(p * rotate);
  });

  return (
    <div ref={root} className={className} {...rest}>
      {children}
    </div>
  );
}
