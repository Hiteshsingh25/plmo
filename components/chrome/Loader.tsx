"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DefaultLoadingManager } from "three";
import { SCENE_READY } from "@/lib/events";

gsap.registerPlugin(ScrollTrigger);

/* ── byte-accurate progress for the heavy assets ────────────────────── */
const TRACKED = [
  { match: "/model/coconut.glb", bytes: 4651952 },
  { match: "/model/can1.glb", bytes: 162956 },
  { match: "/model/tex/coconutWhite.webp", bytes: 298506 },
  { match: "empty_warehouse_01_1k.hdr", bytes: 1672140 },
];
const TOTAL = TRACKED.reduce((a, t) => a + t.bytes, 0);
const done = new Set<string>();
const partial = new Map<string, number>();
const subscribers = new Set<(p: number) => void>();
let best = 0;
let patched = false;

function publish() {
  let got = 0;
  for (const t of TRACKED) got += done.has(t.match) ? t.bytes : (partial.get(t.match) ?? 0);
  const p = (got / TOTAL) * 100;
  if (p <= best) return;
  best = p;
  subscribers.forEach((fn) => fn(best));
}
function markDone(url: unknown) {
  if (typeof url !== "string") return;
  for (const t of TRACKED) {
    if (!done.has(t.match) && url.includes(t.match)) {
      done.add(t.match);
      partial.delete(t.match);
      publish();
      return;
    }
  }
}
function patchLoaders() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const prevProgress = DefaultLoadingManager.onProgress;
  const prevError = DefaultLoadingManager.onError;
  DefaultLoadingManager.onProgress = (url, loaded, total) => {
    prevProgress?.(url, loaded, total);
    markDone(url);
  };
  DefaultLoadingManager.onError = (url) => {
    prevError?.(url);
    markDone(url);
  };
  if (typeof window.fetch !== "function") return;
  const realFetch = window.fetch.bind(window);
  window.fetch = function (input, ...args) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request)?.url ?? "";
    const t = TRACKED.find((x) => url.includes(x.match));
    const res = realFetch(input, ...args);
    if (!t) return res;
    return res.then((r) => {
      try {
        const reader = r.clone().body?.getReader();
        if (reader) {
          let n = 0;
          const pump = ({ done: d, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> | undefined => {
            if (d) return;
            n += value.length;
            if (!done.has(t.match)) {
              partial.set(t.match, Math.min(n, t.bytes));
              publish();
            }
            return reader.read().then(pump);
          };
          reader.read().then(pump).catch(() => {});
        }
      } catch {}
      return r;
    });
  };
}
patchLoaders();

/* ── rolling digits ─────────────────────────────────────────────────── */
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

function Digit({ value }: { value: number }) {
  const col = useRef<HTMLSpanElement>(null);
  const pos = useRef({ p: 0 });
  const init = useRef(false);
  const tween = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    const el = col.current;
    if (!el) return;
    const render = () => {
      el.style.transform = `translateY(${-(pos.current.p % 10)}em)`;
    };
    if (!init.current) {
      init.current = true;
      pos.current.p = value;
      render();
      return;
    }
    const cur = pos.current.p;
    let target = 10 * Math.floor(cur / 10) + value;
    while (target <= cur + 0.001) target += 10;
    tween.current?.kill();
    tween.current = gsap.to(pos.current, { p: target, duration: 0.3, ease: "power2.out", overwrite: "auto", onUpdate: render });
  }, [value]);
  useEffect(() => () => {
    tween.current?.kill();
  }, []);
  return (
    <span className="relative inline-block overflow-hidden align-bottom tabular-nums leading-none" style={{ height: "1em", width: "0.48em" }} aria-hidden>
      <span ref={col} className="block will-change-transform">
        {DIGITS.map((d, i) => (
          <span key={i} className="flex items-center justify-center leading-none" style={{ height: "1em" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function Counter({ value }: { value: number }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <span className="inline-flex items-end leading-none tracking-[-0.06em]" aria-live="polite">
      <span className="sr-only">{v} percent loaded</span>
      <Digit value={Math.floor(v / 100)} />
      <Digit value={Math.floor((v % 100) / 10)} />
      <Digit value={v % 10} />
    </span>
  );
}

const PANEL = "absolute -top-[30dvh] left-0 h-[160dvh] w-[58%] will-change-transform";
const TREE =
  "M276.9 249.322L245.035 358.522L218.104 349.667L239.372 377.927L200.966 509.509C167.804 469.088 154.52 411.898 170.563 356.94C186.604 301.952 228.007 262.772 276.9 249.322ZM103.415 207.766C157.405 181.329 218.871 187.303 273.502 218.22L111.253 297.676L93.7865 257.119L90.1138 308.033L0 352.169C13.6111 287.814 49.4243 234.204 103.415 207.766ZM208.565 116.324L163.197 142.072L124.48 120.504L144.267 80.4888L98.9187 106.247L18.5067 61.4334C67.6015 24.6383 133.909 17.6759 190.768 49.3588C247.628 81.052 279.895 142.964 279.238 206.757L188.778 156.327L208.565 116.324ZM396.393 62.3739L422.723 91.8752L302.498 212.828C288.192 156.793 303.813 92.8834 347.994 48.4469C392.172 4.00119 453.144 -9.11952 505.07 9.05494L442.601 71.8976L396.393 62.3739ZM453.656 172.446C505.236 188.06 541.998 231.991 553.217 283.818L494.986 266.187L485.685 236.307L478.98 261.357L426.871 245.588L416.035 210.724L408.197 239.944L313.736 211.373C349.017 173.619 402.059 156.851 453.656 172.446ZM291.272 233.752L312.996 223.029C391.719 410.788 337.783 853.463 337.783 853.463L267.028 820.022C325.93 605.308 299.765 276.926 291.272 233.752Z";

/**
 * Preloader: palm silhouette fills bottom-up with real download progress,
 * then the four panels sweep apart. Minimum 3s on screen, hard cap 25s.
 */
export default function Loader() {
  const root = useRef<HTMLElement>(null);
  const treeWrap = useRef<HTMLDivElement>(null);
  const fill = useRef<SVGGElement>(null);
  const counter = useRef<HTMLDivElement>(null);
  const fl = useRef<HTMLDivElement>(null);
  const fr = useRef<HTMLDivElement>(null);
  const bl = useRef<HTMLDivElement>(null);
  const br = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number | null>(null);
  const finishing = useRef(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const shown = useRef(0);
  const [visible, setVisible] = useState(true);
  const [pct, setPct] = useState(0);

  if (startedAt.current === null) startedAt.current = Date.now();

  useEffect(() => {
    if (fill.current) gsap.set(fill.current, { attr: { transform: "translate(0, 860)" } });
  }, []);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    const announce = () => {
      if (window.__loaderFinished) return;
      window.__loaderFinished = true;
      window.dispatchEvent(new Event("loaderComplete"));
    };
    if (!root.current) {
      announce();
      setVisible(false);
      return;
    }
    const t = gsap.timeline({
      defaults: { ease: "power3.inOut" },
      onComplete: () => {
        announce();
        setVisible(false);
      },
    });
    tl.current = t;
    gsap.set(root.current, { pointerEvents: "none" });
    if (shown.current < 100) {
      shown.current = 100;
      setPct(100);
    }
    if (fill.current) t.to(fill.current, { attr: { transform: "translate(0, 0)" }, duration: 0.4, ease: "power2.out" });
    if (counter.current) t.to(counter.current, { autoAlpha: 0, y: 28, duration: 0.35, ease: "power2.in" }, 0);
    if (treeWrap.current) {
      const wipe = { v: -36 };
      const apply = () => treeWrap.current?.style.setProperty("--wipe", `${wipe.v}%`);
      apply();
      t.to(wipe, { v: 100, duration: 0.7, ease: "power2.inOut", onUpdate: apply }, "-=0.05");
    }
    const sweep = { xPercent: 170, duration: 1.45, ease: "power3.inOut" };
    if (fl.current && fr.current) {
      t.to(fl.current, { ...sweep, xPercent: -170, rotate: -5 }, "-=0.08");
      t.to(fr.current, { ...sweep, rotate: 5 }, "<");
    }
    if (bl.current && br.current) {
      t.to(bl.current, { ...sweep, xPercent: -170, rotate: -5 }, "-=1.2");
      t.to(br.current, { ...sweep, rotate: 5 }, "<");
    }
    t.add(announce, "-=1.2");
  }, []);

  useEffect(() => {
    const hasScene = !!document.getElementById("coconut-sequence");
    let sceneReady = !hasScene || !!window.__palmoSceneReady;
    const onScene = () => {
      sceneReady = true;
    };
    window.addEventListener(SCENE_READY, onScene);

    let target = 0;
    let fullAt = 0;
    const onProgress = (p: number) => {
      target = p;
      if (p >= 99.9 && !fullAt) fullAt = performance.now();
    };
    subscribers.add(onProgress);
    onProgress(best);

    let shownF = 0;
    let last = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      if (finishing.current) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = Date.now() - (startedAt.current ?? now);
      const stalled = fullAt > 0 && now - fullAt > 2500;
      const ready = sceneReady || stalled;
      if (ready) {
        shownF += (100 - shownF) * (1 - Math.exp(-6 * dt));
        if (100 - shownF < 0.4) shownF = 100;
      } else if (shownF < target) {
        shownF += (target - shownF) * (1 - Math.exp(-4.5 * dt));
        if (target - shownF < 0.05) shownF = target;
      } else {
        // creep toward (target + 12) so the counter never looks frozen
        const ceil = Math.min(99, target + 12);
        shownF += (ceil - shownF) * (1 - Math.exp(-0.45 * dt));
      }
      const rounded = Math.round(shownF);
      if (rounded !== shown.current) {
        shown.current = rounded;
        setPct(rounded);
      }
      fill.current?.setAttribute("transform", `translate(0, ${860 * (1 - shownF / 100)})`);
      if (ready && elapsed >= 3000 && (shownF >= 99.5 || elapsed >= 4000)) {
        cancelAnimationFrame(raf);
        finish();
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      subscribers.delete(onProgress);
      window.removeEventListener(SCENE_READY, onScene);
    };
  }, [finish]);

  useEffect(() => {
    const cap = setTimeout(finish, 25000);
    return () => {
      clearTimeout(cap);
      tl.current?.kill();
    };
  }, [finish]);

  useEffect(() => {
    if (!visible) ScrollTrigger.refresh();
  }, [visible]);

  if (!visible) return null;

  return (
    <section ref={root} id="loader" className="fixed top-0 left-0 z-999 flex h-screen w-full items-center justify-center overflow-hidden max-md:h-dvh">
      <div ref={bl} className={`${PANEL} z-1 origin-right bg-beige`} />
      <div ref={br} className={`${PANEL} right-0 left-auto z-1 origin-left bg-beige`} />
      <div ref={fl} className={`${PANEL} z-2 origin-right bg-foreground`} />
      <div ref={fr} className={`${PANEL} right-0 left-auto z-2 origin-left bg-foreground`} />
      <div
        ref={treeWrap}
        className="relative z-10"
        style={
          {
            "--wipe": "-36%",
            WebkitMaskImage: "linear-gradient(to top, transparent 0%, transparent var(--wipe), #000 calc(var(--wipe) + 36%), #000 100%)",
            maskImage: "linear-gradient(to top, transparent 0%, transparent var(--wipe), #000 calc(var(--wipe) + 36%), #000 100%)",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 554 860" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-[10vw] max-md:w-[36vw] overflow-visible will-change-transform" style={{ height: "auto", transformOrigin: "center center" }}>
          <defs>
            <clipPath id="loader-tree-clip">
              <path d={TREE} />
            </clipPath>
          </defs>
          <g clipPath="url(#loader-tree-clip)">
            <rect x="0" y="-10" width={554} height={870} fill="var(--beige)" opacity="0.15" />
            <g ref={fill}>
              <rect x="0" y="0" width={554} height={860} fill="var(--beige)" />
            </g>
          </g>
          <path d={TREE} stroke="var(--beige)" strokeWidth="2" fill="none" opacity="0.3" />
        </svg>
      </div>
      <div
        ref={counter}
        className="fixed bottom-8 left-8 z-10 flex items-end gap-1 text-beige max-md:bottom-[4dvh] max-md:left-1/2 max-md:-translate-x-1/2"
        style={{ fontFamily: "var(--font-khand)", fontWeight: 600, fontSize: "clamp(3rem, 6vw, 5rem)" }}
      >
        <Counter value={pct} />
        <span className="opacity-60 leading-none pb-1" style={{ fontSize: "clamp(1rem, 2vw, 1.5rem)" }}>
          %
        </span>
      </div>
    </section>
  );
}
