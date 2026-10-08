// Tiny window-event bus shared by the 3D scene, the loader and the copy overlays.

declare global {
  interface Window {
    __loaderFinished?: boolean;
    __pageTransitionActive?: boolean;
    __palmoSceneReady?: boolean;
  }
}

/* ── coconut sequence ───────────────────────────────────────────────── */
export const SEQ = {
  shake: "coconut:shake",
  burst: "coconut:burst",
  can: "coconut:can",
  reset: "coconut:reset",
} as const;

export function emitSeq(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function onSeq(name: string, handler: (e: CustomEvent) => void) {
  const h = handler as EventListener;
  window.addEventListener(name, h);
  return () => window.removeEventListener(name, h);
}

/* ── loader ─────────────────────────────────────────────────────────── */
/** Run `fn` once the preloader has finished (immediately if there is none). */
export function onLoaderCue(fn: () => void, { delay = 0 }: { delay?: number } = {}) {
  let done = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const fire = () => {
    if (done) return;
    done = true;
    if (delay > 0) timers.push(setTimeout(fn, delay * 1000));
    else fn();
  };
  if (!document.getElementById("loader") || window.__loaderFinished) {
    fire();
    return () => timers.forEach(clearTimeout);
  }
  window.addEventListener("loaderComplete", fire);
  const poll = setInterval(() => {
    if (window.__loaderFinished || !document.getElementById("loader")) {
      clearInterval(poll);
      fire();
    }
  }, 200);
  return () => {
    clearInterval(poll);
    timers.forEach(clearTimeout);
    window.removeEventListener("loaderComplete", fire);
  };
}

/* ── scene ready (first R3F frame rendered) ─────────────────────────── */
export const SCENE_READY = "palmo:scene-ready";

export function markSceneReady() {
  if (window.__palmoSceneReady) return;
  window.__palmoSceneReady = true;
  window.dispatchEvent(new Event(SCENE_READY));
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
