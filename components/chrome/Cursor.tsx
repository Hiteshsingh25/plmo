"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; t: number };

/**
 * Fixed full-viewport canvas (z-998) that paints a soft beige blade-trail
 * behind the pointer. Fades out over the footer, where the game draws its own.
 */
export default function Cursor() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ trail: Point[]; strength: number; muted: boolean }>({ trail: [], strength: 1, muted: false });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = `${window.innerWidth}px`;
      c.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let raf: number | null = null;
    let io: IntersectionObserver | undefined;
    const kick = () => {
      if (raf == null) raf = requestAnimationFrame(draw);
    };
    const zonesT = setTimeout(() => {
      const zones = document.querySelectorAll("[data-slash-zone]");
      if (!zones.length) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) state.current.muted = e.isIntersecting && e.intersectionRatio > 0.15;
          kick();
        },
        { threshold: [0, 0.15, 0.5] },
      );
      zones.forEach((z) => io!.observe(z));
    }, 100);

    const draw = () => {
      const s = state.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const now = Date.now();
      const target = s.muted ? 0 : 1;
      s.strength += (target - s.strength) * 0.1;
      if (Math.abs(target - s.strength) < 0.002) s.strength = target;
      const k = s.strength;
      ctx.clearRect(0, 0, w, h);
      s.trail = s.trail.filter((p) => now - p.t < 220);
      const tr = s.trail;
      if (k > 0.02 && tr.length >= 3) {
        const left: { x: number; y: number }[] = [];
        const right: { x: number; y: number }[] = [];
        for (let i = 0; i < tr.length - 1; i++) {
          const a = tr[i];
          const b = tr[i + 1];
          const age = Math.max(0, 1 - (now - a.t) / 220);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d === 0) continue;
          const nx = -dy / d;
          const ny = dx / d;
          const wdt = Math.min(6, 0.5 * d) * Math.sin((i / (tr.length - 1)) * Math.PI) * age * k;
          left.push({ x: a.x + nx * wdt, y: a.y + ny * wdt });
          right.push({ x: a.x - nx * wdt, y: a.y - ny * wdt });
        }
        if (left.length > 1) {
          ctx.save();
          ctx.globalAlpha = 0.28 * k;
          ctx.beginPath();
          ctx.moveTo(left[0].x, left[0].y);
          for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
          for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
          ctx.closePath();
          ctx.fillStyle = "#FFE386";
          ctx.fill();
          ctx.restore();
        }
      }
      if (tr.length === 0 && s.strength === target) {
        raf = null;
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      state.current.trail.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      kick();
    };
    const onVis = () => {
      if (document.hidden) {
        state.current.trail = [];
        if (raf != null) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      }
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);
    return () => {
      clearTimeout(zonesT);
      io?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-998 h-full w-full" />;
}
