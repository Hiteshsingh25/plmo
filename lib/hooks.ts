"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** True while `ref` is on screen (with margin) and the tab is visible. Drives R3F frameloops. */
export function useInView(ref: RefObject<HTMLElement | null>, { rootMargin = "200px" }: { rootMargin?: string } = {}) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref?.current;
    if (!el) return;
    let intersecting = true;
    let visible = !document.hidden;
    const io = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        setInView(intersecting && visible);
      },
      { threshold: 0, rootMargin },
    );
    io.observe(el);
    const onVis = () => {
      visible = !document.hidden;
      setInView(intersecting && visible);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref, rootMargin]);
  return inView;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Perm = "unknown" | "granted" | "denied";
let orientationPerm: Perm = "unknown";
let requesting = false;
let listening = false;
const pending = new Set<() => void>();
const GESTURES = ["touchend", "pointerup", "click", "keydown"];

type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

function stopListening() {
  if (!listening) return;
  listening = false;
  GESTURES.forEach((t) => window.removeEventListener(t, askPermission));
}
function askPermission() {
  if (requesting || orientationPerm === "granted") return;
  requesting = true;
  (DeviceOrientationEvent as DOE)
    .requestPermission?.()
    .then((res) => {
      requesting = false;
      if (res === "granted") {
        orientationPerm = "granted";
        stopListening();
        [...pending].forEach((fn) => fn());
      } else {
        orientationPerm = "denied";
        stopListening();
      }
    })
    .catch(() => {
      requesting = false;
    });
}

/**
 * Normalised pointer (-1..1) on desktop, device tilt on phones.
 * Returns a ref so consumers can read it inside rAF/useFrame without re-rendering.
 */
export function useMouse({ onChange, enabled = true }: { onChange?: (x: number, y: number) => void; enabled?: boolean } = {}) {
  const pos = useRef({ x: 0, y: 0 });
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    if (!enabled) return;
    const set = (x: number, y: number) => {
      pos.current.x = x;
      pos.current.y = y;
      cb.current?.(x, y);
    };
    const onMove = (e: PointerEvent) => set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    window.addEventListener("pointermove", onMove, { passive: true });

    let stopOrientation = () => {};
    let unsubPending = () => {};
    if ("DeviceOrientationEvent" in window) {
      let base: { pitch: number; roll: number } | null = null;
      const onOrient = (e: DeviceOrientationEvent) => {
        const { beta, gamma } = e;
        if (beta == null || gamma == null) return;
        const angle = (screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0) as number;
        let pitch = beta;
        let roll = gamma;
        if (angle === 90) {
          pitch = -gamma;
          roll = beta;
        } else if (angle === 180) {
          pitch = -beta;
          roll = -gamma;
        } else if (angle === 270 || angle === -90) {
          pitch = gamma;
          roll = -beta;
        }
        if (!base) base = { pitch, roll };
        set(clamp((roll - base.roll) / 25, -1, 1), clamp((pitch - base.pitch) / 25, -1, 1));
      };
      const reset = () => {
        base = null;
      };
      const start = () => {
        window.addEventListener("deviceorientation", onOrient);
        window.addEventListener("orientationchange", reset);
        stopOrientation = () => {
          window.removeEventListener("deviceorientation", onOrient);
          window.removeEventListener("orientationchange", reset);
        };
      };
      if (typeof (DeviceOrientationEvent as DOE).requestPermission === "function") {
        // iOS: wait for a user gesture before asking.
        if (orientationPerm === "granted") start();
        else if (orientationPerm === "unknown") {
          pending.add(start);
          if (!listening) {
            listening = true;
            GESTURES.forEach((t) => window.addEventListener(t, askPermission, { passive: true }));
          }
          unsubPending = () => pending.delete(start);
        }
      } else start();
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      unsubPending();
      stopOrientation();
    };
  }, [enabled]);
  return pos;
}

/** Matches the original site's "mobile" breakpoint (≤1025px). */
export function useIsMobile(max = 1025) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= max);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [max]);
  return mobile;
}
