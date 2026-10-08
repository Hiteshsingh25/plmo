"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import type Lenis from "lenis";
import { useAnimation } from "./AnimationContext";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(ScrollTrigger);

const PANEL = "absolute -top-[30dvh] left-0 h-[160dvh] w-[58%] will-change-transform";

const TransitionCtx = createContext<{ transitionTo: (href: string) => Promise<void> }>({ transitionTo: async () => {} });
export const usePageTransition = () => useContext(TransitionCtx);

const toURL = (href: string) => new URL(href, window.location.href);

function shouldIntercept(href: string | null) {
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  try {
    const u = toURL(href);
    if (u.origin !== window.location.origin) return false;
    return u.pathname !== window.location.pathname || u.search !== window.location.search || !!u.hash;
  } catch {
    return false;
  }
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function scrollToHash(lenis: Lenis | undefined, hash: string) {
  if (!hash) return;
  const el = document.querySelector(hash) as HTMLElement | null;
  if (!el) return;
  if (prefersReducedMotion()) {
    el.scrollIntoView();
    return;
  }
  const offset = -Math.round(Math.min(0.02 * window.innerWidth, 24));
  const cur = lenis?.scroll ?? window.scrollY;
  const dist = Math.abs(el.getBoundingClientRect().top + cur + offset - cur);
  const duration = Math.min(3.8, Math.max(1.6, dist / 900));
  if (lenis) lenis.scrollTo(el, { offset, duration, easing: easeInOutCubic, lock: true });
  else el.scrollIntoView({ behavior: "smooth" });
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode };

/** next/link that routes through the beige/brown wipe. */
export const TransitionLink = forwardRef<HTMLAnchorElement, LinkProps>(function TransitionLink({ href, children, onClick, ...rest }, ref) {
  const { transitionTo } = usePageTransition();
  return (
    <Link
      ref={ref}
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (shouldIntercept(href)) {
          e.preventDefault();
          transitionTo(href);
        }
      }}
      {...rest}
    >
      {children}
    </Link>
  );
});

export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);
  const { setIsTransitionFinished } = useAnimation();

  const bl = useRef<HTMLDivElement>(null);
  const br = useRef<HTMLDivElement>(null);
  const fl = useRef<HTMLDivElement>(null);
  const fr = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const pendingNav = useRef<{ path: string; hash: string } | null>(null);
  const externalNav = useRef<{ path: string; hash: string } | null>(null);
  const first = useRef(true);

  const park = useCallback(() => {
    gsap.set([bl.current, fl.current], { xPercent: -170, rotate: -5 });
    gsap.set([br.current, fr.current], { xPercent: 170, rotate: 5 });
  }, []);

  useLayoutEffect(() => {
    park();
    gsap.set(overlay.current, { autoAlpha: 0 });
  }, [park]);

  const interactive = (on: boolean) => {
    if (overlay.current) overlay.current.style.pointerEvents = on ? "auto" : "none";
  };

  const coverInstantly = useCallback(() => {
    window.__pageTransitionActive = true;
    gsap.killTweensOf([bl.current, br.current, fl.current, fr.current]);
    gsap.set([bl.current, fl.current, br.current, fr.current], { xPercent: 0, rotate: 0 });
    interactive(true);
    gsap.set(overlay.current, { autoAlpha: 1 });
    setIsTransitionFinished(false);
  }, [setIsTransitionFinished]);

  const cover = useCallback(
    () =>
      new Promise<void>((resolve) => {
        window.__pageTransitionActive = true;
        if (prefersReducedMotion()) {
          setIsTransitionFinished(false);
          resolve();
          return;
        }
        interactive(true);
        gsap.set(overlay.current, { autoAlpha: 1 });
        setIsTransitionFinished(false);
        const v = { xPercent: 0, rotate: 0, duration: 1.3, ease: "power3.inOut" };
        const tl = gsap.timeline({ onComplete: resolve });
        tl.to([bl.current, br.current], v);
        tl.to([fl.current, fr.current], v, "-=1.1");
      }),
    [setIsTransitionFinished],
  );

  const reveal = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const finish = () => {
          park();
          gsap.set(overlay.current, { autoAlpha: 0 });
          interactive(false);
          setIsTransitionFinished(true);
          window.__pageTransitionActive = false;
          window.dispatchEvent(new CustomEvent("pageTransitionComplete"));
          resolve();
        };
        if (prefersReducedMotion()) {
          finish();
          return;
        }
        const v = { duration: 1.45, ease: "power3.inOut" };
        const tl = gsap.timeline({ onComplete: finish });
        tl.to(fl.current, { ...v, xPercent: -170, rotate: -5 }, 0);
        tl.to(fr.current, { ...v, xPercent: 170, rotate: 5 }, 0);
        tl.to(bl.current, { ...v, xPercent: -170, rotate: -5 }, 0.25);
        tl.to(br.current, { ...v, xPercent: 170, rotate: 5 }, 0.25);
      }),
    [park, setIsTransitionFinished],
  );

  const transitionTo = useCallback(
    async (href: string) => {
      if (busy.current) return;
      const u = toURL(href);
      if (u.pathname === window.location.pathname && u.search === window.location.search) {
        if (u.hash) scrollToHash(lenis, u.hash);
        return;
      }
      busy.current = true;
      lenis?.stop();
      await cover();
      pendingNav.current = { path: u.pathname, hash: u.hash };
      router.push(u.pathname + u.search + u.hash, { scroll: false });
    },
    [lenis, cover, router],
  );

  // Back/forward navigation arrives without a cover — snap the panels shut.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const p = pendingNav.current;
    if (p && p.path === pathname) return;
    pendingNav.current = null;
    busy.current = true;
    externalNav.current = { path: pathname, hash: window.location.hash };
    if (!prefersReducedMotion()) coverInstantly();
    lenisRef.current?.stop();
  }, [pathname, coverInstantly]);

  useEffect(() => {
    const p = pendingNav.current;
    const x = externalNav.current;
    let hash = "";
    if (p && p.path === pathname) {
      pendingNav.current = null;
      hash = p.hash;
    } else if (x && x.path === pathname) {
      externalNav.current = null;
      hash = x.hash;
    } else return;
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => {
      reveal().then(() => {
        busy.current = false;
        lenis?.start();
        ScrollTrigger.refresh();
        if (hash) {
          const tryScroll = (n = 0) => {
            if (document.querySelector(hash) || n > 16) scrollToHash(lenis, hash);
            else requestAnimationFrame(() => tryScroll(n + 1));
          };
          requestAnimationFrame(() => tryScroll());
        }
      });
    });
  }, [pathname, lenis, reveal]);

  // Intercept every same-origin anchor so plain <a> tags get the wipe too.
  useEffect(() => {
    const onClick = (e: globalThis.MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-menu-link")) return;
      const href = a.getAttribute("href");
      if (shouldIntercept(href)) {
        e.preventDefault();
        transitionTo(href!);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [transitionTo]);

  return (
    <TransitionCtx.Provider value={{ transitionTo }}>
      {children}
      <div ref={overlay} aria-hidden className="pointer-events-none fixed inset-0 z-[980] overflow-hidden">
        <div ref={bl} className={`${PANEL} z-1 origin-right bg-beige`} />
        <div ref={br} className={`${PANEL} right-0 left-auto z-1 origin-left bg-beige`} />
        <div ref={fl} className={`${PANEL} z-2 origin-right bg-foreground`} />
        <div ref={fr} className={`${PANEL} right-0 left-auto z-2 origin-left bg-foreground`} />
      </div>
    </TransitionCtx.Provider>
  );
}
