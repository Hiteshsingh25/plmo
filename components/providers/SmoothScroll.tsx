"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, type LenisRef } from "lenis/react";

gsap.registerPlugin(ScrollTrigger);

/** Lenis on the GSAP ticker so ScrollTrigger and scrubs share one clock. */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const ref = useRef<LenisRef>(null);

  useEffect(() => {
    const tick = (time: number) => ref.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const lenis = ref.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);
    return () => {
      lenis?.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={ref}
      options={{
        autoRaf: false,
        duration: 1.5,
        lerp: 0.075,
        smoothWheel: true,
        syncTouch: true,
        wheelMultiplier: 0.8,
        touchMultiplier: 0.9,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      {children}
    </ReactLenis>
  );
}
