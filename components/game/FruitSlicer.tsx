"use client";

import { useEffect, useRef } from "react";

type Kind = {
  type: string;
  src?: string;
  emoji?: string;
  color: string;
  bg: string;
  vwRadius: number;
};

const KINDS: Kind[] = [
  { type: "coconut", src: "/fruits/coconut.webp", color: "#FFFFFF", bg: "#463721", vwRadius: 2.6 },
  { type: "pineapple", src: "/fruits/pineapple.webp", color: "#FFE569", bg: "#D48806", vwRadius: 2.8 },
  { type: "watermelon", src: "/fruits/watermolon.webp", color: "#FF4D4F", bg: "#1E4620", vwRadius: 2.7 },
  { type: "guava", src: "/fruits/guava.webp", color: "#A8E063", bg: "#4E7D2B", vwRadius: 2.2 },
  { type: "strawberry", src: "/fruits/strawberry.webp", color: "#FF3366", bg: "#8B0000", vwRadius: 2 },
  { type: "lychee", src: "/fruits/lychee.webp", color: "#FF6688", bg: "#7A1C30", vwRadius: 1.9 },
  { type: "bomb", emoji: "💣", color: "#FF4D4F", bg: "#1F1F1F", vwRadius: 1.9 },
];

type Fruit = Kind & { radius: number; id: number; x: number; y: number; vx: number; vy: number; rotation: number; vRot: number; sliced: boolean };
type Half = { type: string; emoji?: string; color: string; bg: string; radius: number; x: number; y: number; vx: number; vy: number; rotation: number; vRot: number; side: "left" | "right" };
type Particle = { x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; isSmoke?: boolean };
type Shockwave = { x: number; y: number; radius: number; maxRadius: number; width: number; color: string; alpha: number };
type Blast = { x: number; y: number; scale: number; maxScale: number; vy: number; rotation: number; alpha: number };
type Pt = { x: number; y: number; t: number };

type State = {
  fruits: Fruit[];
  halves: Half[];
  particles: Particle[];
  shockwaves: Shockwave[];
  blasts: Blast[];
  trail: Pt[];
  mouse: { x: number; y: number };
  spawnCounter: number;
  flashAlpha: number;
  shakeIntensity: number;
  score: number;
  bombsHit: number;
};

export type Score = { score: number; bombsHit: number };

function segDist(p: { x: number; y: number }, a: Pt, b: Pt) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

function pickKind(): Kind {
  const r = Math.random();
  if (r > 0.9) return KINDS[6];
  if (r > 0.75) return KINDS[1];
  if (r > 0.6) return KINDS[2];
  if (r > 0.45) return KINDS[3];
  if (r > 0.3) return KINDS[4];
  if (r > 0.15) return KINDS[5];
  return KINDS[0];
}

/**
 * Fruit-ninja style canvas. Fruit arcs up from the bottom; dragging the pointer
 * across it slices with a glowing blade trail. Three bombs reset the score.
 * Only animates while on screen and the tab is visible.
 */
export default function FruitSlicer({ onScoreChange }: { onScoreChange?: (s: Score) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = useRef<Record<string, HTMLImageElement>>({});
  const cb = useRef(onScoreChange);
  useEffect(() => {
    cb.current = onScoreChange;
  }, [onScoreChange]);

  const state = useRef<State>({
    fruits: [],
    halves: [],
    particles: [],
    shockwaves: [],
    blasts: [],
    trail: [],
    mouse: { x: 0, y: 0 },
    spawnCounter: 0,
    flashAlpha: 0,
    shakeIntensity: 0,
    score: 0,
    bombsHit: 0,
  });

  useEffect(() => {
    KINDS.forEach((k) => {
      if (!k.src) return;
      const img = new Image();
      img.src = k.src;
      images.current[k.type] = img;
    });
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let raf: number | null = null;

    const resize = () => {
      if (!wrap.current) return;
      const r = wrap.current.getBoundingClientRect();
      c.width = r.width;
      c.height = r.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const report = (s: State) => cb.current?.({ score: s.score, bombsHit: s.bombsHit });

    const draw = () => {
      const s = state.current;
      const W = c.width;
      const H = c.height;
      let sx = 0;
      let sy = 0;
      if (s.shakeIntensity > 0.5) {
        sx = (Math.random() - 0.5) * s.shakeIntensity;
        sy = (Math.random() - 0.5) * s.shakeIntensity;
        s.shakeIntensity *= 0.86;
      } else s.shakeIntensity = 0;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.clearRect(-30, -30, W + 60, H + 60);

      // spawn
      s.spawnCounter++;
      if (s.spawnCounter % 50 === 0) {
        const n = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const k = pickKind();
          const x = 0.15 * W + 0.7 * W * Math.random();
          const vw = window.innerWidth || W;
          const radius = ((vw < 768 ? 3.8 * k.vwRadius : k.vwRadius) / 100) * vw;
          s.fruits.push({
            ...k,
            radius,
            id: Math.random(),
            x,
            y: H + 0.5 * radius,
            vx: 0.004 * W * (Math.random() - 0.5),
            vy: -(0.018 * H + 0.008 * H * Math.random()),
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.12,
            sliced: false,
          });
        }
      }

      // slicing
      const tl = s.trail.length;
      if (tl >= 2) {
        const a = s.trail[tl - 1];
        const b = s.trail[tl - 2];
        if (Math.hypot(a.x - b.x, a.y - b.y) > 3) {
          for (const f of s.fruits) {
            if (f.sliced || segDist(f, a, b) >= f.radius + 14) continue;
            f.sliced = true;
            if (f.type === "bomb") {
              s.bombsHit += 1;
              if (s.bombsHit >= 3) {
                s.score = 0;
                s.bombsHit = 0;
              }
              report(s);
              s.flashAlpha = 0.9;
              s.shakeIntensity = 26;
              s.shockwaves.push(
                { x: f.x, y: f.y, radius: 10, maxRadius: 7 * f.radius, width: 8, color: "#FFE386", alpha: 1 },
                { x: f.x, y: f.y, radius: 4, maxRadius: 9 * f.radius, width: 14, color: "#FF3300", alpha: 0.9 },
              );
              s.blasts.push({ x: f.x, y: f.y, scale: 0.4, maxScale: 1.6, vy: -1.8, rotation: (Math.random() - 0.5) * 0.3, alpha: 1 });
              const palette = ["#FF2200", "#FF7700", "#FFCC00", "#FFFFFF", "#FFAA00", "#FF3366", "#555555"];
              for (let i = 0; i < 65; i++) {
                const ang = Math.random() * Math.PI * 2;
                const sp = 3 + 15 * Math.random();
                const col = palette[Math.floor(Math.random() * palette.length)];
                s.particles.push({ x: f.x, y: f.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, size: (col === "#555555" ? 8 : 4) + 8 * Math.random(), color: col, isSmoke: col === "#555555", life: 1 });
              }
            } else {
              s.score += 1;
              report(s);
              const base = { type: f.type, emoji: f.emoji, color: f.color, bg: f.bg, radius: f.radius, rotation: f.rotation, y: f.y, vy: f.vy - 2.2 };
              s.halves.push({ ...base, x: f.x - 6, vx: f.vx - 4.2, vRot: -0.22, side: "left" }, { ...base, x: f.x + 6, vx: f.vx + 4.2, vRot: 0.22, side: "right" });
              for (let i = 0; i < 14; i++) {
                const ang = Math.random() * Math.PI * 2;
                const sp = 2.5 + 7 * Math.random();
                s.particles.push({ x: f.x, y: f.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, size: 3 + 5 * Math.random(), color: f.color, life: 1 });
              }
            }
          }
        }
      }

      // shockwaves
      s.shockwaves = s.shockwaves.filter((w) => w.alpha > 0.02);
      for (const w of s.shockwaves) {
        w.radius += (w.maxRadius - w.radius) * 0.18 + 1.5;
        w.alpha *= 0.88;
        ctx.save();
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.width * w.alpha;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 24;
        ctx.globalAlpha = Math.max(0, w.alpha);
        ctx.stroke();
        ctx.restore();
      }

      // whole fruit
      s.fruits = s.fruits.filter((f) => !f.sliced && f.y < H + 60);
      for (const f of s.fruits) {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.28;
        f.rotation += f.vRot;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        const img = images.current[f.type];
        if (img && img.complete && img.naturalWidth !== 0) ctx.drawImage(img, -f.radius, -f.radius, 2 * f.radius, 2 * f.radius);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, f.radius, 0, 2 * Math.PI);
          ctx.fillStyle = f.bg;
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#FFE386";
          ctx.stroke();
          if (f.emoji) {
            ctx.font = `${1.1 * f.radius}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(f.emoji, 0, 0);
          }
        }
        ctx.restore();
      }

      // halves
      s.halves = s.halves.filter((h) => h.y < H + 60);
      for (const h of s.halves) {
        h.x += h.vx;
        h.y += h.vy;
        h.vy += 0.35;
        h.rotation += h.vRot;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);
        ctx.beginPath();
        if (h.side === "left") ctx.arc(0, 0, h.radius, 0.5 * Math.PI, 1.5 * Math.PI);
        else ctx.arc(0, 0, h.radius, 1.5 * Math.PI, 0.5 * Math.PI);
        ctx.closePath();
        ctx.clip();
        const img = images.current[h.type];
        if (img && img.complete && img.naturalWidth !== 0) ctx.drawImage(img, -h.radius, -h.radius, 2 * h.radius, 2 * h.radius);
        else {
          ctx.fillStyle = h.bg;
          ctx.fillRect(-h.radius, -h.radius, 2 * h.radius, 2 * h.radius);
          if (h.emoji) {
            ctx.font = `${1.25 * h.radius}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(h.emoji, 0, 0);
          }
        }
        ctx.restore();
      }

      // particles
      s.particles = s.particles.filter((p) => p.life > 0);
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.isSmoke ? -0.05 : 0.18;
        p.life -= 0.035;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.size * p.life), 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // BOOM text
      s.blasts = s.blasts.filter((b) => b.alpha > 0.02);
      for (const b of s.blasts) {
        b.y += b.vy;
        b.scale += (b.maxScale - b.scale) * 0.2;
        b.alpha -= 0.03;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.scale(b.scale, b.scale);
        ctx.font = "900 36px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#FF2200";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#FFE386";
        ctx.globalAlpha = Math.max(0, b.alpha);
        ctx.fillText("💥 BOOM!", 0, 0);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FF2200";
        ctx.strokeText("💥 BOOM!", 0, 0);
        ctx.restore();
      }

      // blade trail
      const now = Date.now();
      s.trail = s.trail.filter((p) => now - p.t < 220);
      const tr = s.trail;
      if (tr.length >= 3) {
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
          const w = Math.min(16, 0.75 * d) * Math.sin((i / (tr.length - 1)) * Math.PI) * age;
          left.push({ x: a.x + nx * w, y: a.y + ny * w });
          right.push({ x: a.x - nx * w, y: a.y - ny * w });
        }
        if (left.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(left[0].x, left[0].y);
          for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
          for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
          ctx.closePath();
          ctx.fillStyle = "#FFE386";
          ctx.shadowColor = "#FFE386";
          ctx.shadowBlur = 20;
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowColor = "#FFFFFF";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }
      }

      if (s.flashAlpha > 0.01) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 60, 0, ${0.45 * s.flashAlpha})`;
        ctx.fillRect(-30, -30, W + 60, H + 60);
        s.flashAlpha *= 0.86;
        ctx.restore();
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (!wrap.current) return;
      const r = wrap.current.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (y < 0 || y > r.height || x < 0 || x > r.width) return;
      const s = state.current;
      const n = s.trail.length;
      if (n > 0) {
        const last = s.trail[n - 1];
        if (Math.hypot(x - last.x, y - last.y) > 7 && Math.random() < 0.5) {
          s.particles.push({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, size: 2 + 3 * Math.random(), color: "#FFE386", life: 0.7 });
        }
      }
      s.trail.push({ x, y, t: Date.now() });
      s.mouse = { x, y };
    };
    window.addEventListener("pointermove", onMove);

    let visible = false;
    let tabVisible = !document.hidden;
    const sync = () => {
      const run = visible && tabVisible;
      if (run && raf == null) raf = requestAnimationFrame(draw);
      else if (!run && raf != null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    if (wrap.current) io.observe(wrap.current);
    const onVis = () => {
      tabVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrap} className="relative w-full h-full min-h-[360px] overflow-hidden select-none">
      <canvas ref={canvas} role="img" aria-label="Interactive fruit slicing mini-game. Move pointer or touch across the screen to slice fresh flying coconuts and fruits." className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none">
        Interactive fruit slicing game. Slice flying tropical coconuts and fruit with your pointer or touch.
      </canvas>
    </div>
  );
}
