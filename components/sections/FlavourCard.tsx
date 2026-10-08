"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { formatPrice, PACKS, packPrice, useCart } from "@/lib/cart";
import type { Flavour } from "@/lib/flavours";
import { prefersReducedMotion } from "@/lib/events";
import { CoconutPiece1, CoconutPiece3, Plus } from "@/components/ui/Icons";
import CardCan from "@/components/three/CardCan";

gsap.registerPlugin(useGSAP);

/* ── "+" → pack picker → "Added to basket" ──────────────────────────── */
function AddButton({ flavour, className = "" }: { flavour: Flavour; className?: string }) {
  const { add, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      const p = panel.current;
      if (!p) return;
      if (open) {
        gsap.set(p, { visibility: "visible" });
        gsap.fromTo(p, { y: 12, autoAlpha: 0, scale: 0.94 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.4, ease: "sine.out" });
        gsap.fromTo(p.querySelectorAll("[data-pack]"), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "sine.out", stagger: 0.045, delay: 0.05 });
      } else {
        gsap.to(p, { y: 8, autoAlpha: 0, scale: 0.96, duration: 0.28, ease: "sine.in", onComplete: () => gsap.set(p, { visibility: "hidden" }) });
      }
    },
    { dependencies: [open], scope: root },
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => () => {
    if (toastT.current) clearTimeout(toastT.current);
  }, []);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={`Add ${flavour.name} to basket`}
        className="group/add flex cursor-pointer items-center justify-center"
      >
        <Plus className={`size-[2vw] max-md:size-[6vw] shrink-0 transition-transform duration-500 ${open ? "rotate-135 scale-110" : "group-hover/add:rotate-90 group-hover/add:scale-110"}`} />
      </button>
      <span
        className={`pointer-events-none absolute bottom-[calc(100%+0.6vw)] right-0 whitespace-nowrap rounded-md bg-beige px-[0.6vw] py-[0.2vw] max-md:px-3 max-md:py-1 font-patrick-hand text-foreground transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-[0.4vw] opacity-0"}`}
        style={{ fontSize: "min(0.9rem, 2vh)" }}
      >
        Added to basket
      </span>
      <div ref={panel} style={{ visibility: "hidden" }} className="absolute bottom-[calc(100%+0.8vw)] max-md:bottom-[calc(100%+3vw)] right-0 z-50 w-[14vw] max-md:w-[62vw] origin-bottom-right overflow-hidden rounded-lg bg-foreground p-[0.6vw] max-md:p-3 text-light-beige shadow-lg">
        <p className="px-[0.4vw] max-md:px-2 pb-[0.4vw] max-md:pb-2 font-patrick-hand text-beige" style={{ fontSize: "min(0.85rem, 1.9vh)" }}>
          Pick a pack
        </p>
        {PACKS.map((pack) => (
          <button
            key={pack.id}
            data-pack
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              add(flavour.id, pack.id, 1);
              setOpen(false);
              setToast(true);
              if (toastT.current) clearTimeout(toastT.current);
              toastT.current = setTimeout(() => setToast(false), 1600);
            }}
            tabIndex={open ? 0 : -1}
            className="group/pack flex w-full cursor-pointer items-center justify-between gap-[0.5vw] max-md:gap-2 rounded-md px-[0.4vw] py-[0.35vw] max-md:px-2 max-md:py-2 text-left transition-colors duration-300 hover:bg-light-beige hover:text-foreground"
          >
            <span className="min-w-0">
              <span className="block font-patrick-hand" style={{ fontSize: "min(1rem, 2.2vh)" }}>
                {pack.label}
              </span>
              <span className="block truncate font-patrick-hand opacity-50" style={{ fontSize: "min(0.75rem, 1.7vh)" }}>
                {pack.note}
              </span>
            </span>
            <span className="shrink-0 font-patrick-hand tabular-nums text-beige transition-colors duration-300 group-hover/pack:text-foreground" style={{ fontSize: "min(0.95rem, 2.1vh)" }}>
              {formatPrice(packPrice(pack))}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            openCart();
          }}
          tabIndex={open ? 0 : -1}
          className="mt-[0.3vw] max-md:mt-1 w-full cursor-pointer border-t border-light-beige/15 pt-[0.4vw] max-md:pt-2 font-patrick-hand text-light-beige/50 transition-colors duration-300 hover:text-beige"
          style={{ fontSize: "min(0.75rem, 1.7vh)" }}
        >
          View basket
        </button>
      </div>
    </div>
  );
}

/* off-screen resting pose of the four doodles, cleared on hover */
const DOODLE_OFFSETS = [
  { x: -160, y: 160, spin: -45 },
  { x: 160, y: -160, spin: 60 },
  { x: 160, y: 160, spin: 90 },
  { x: -160, y: -160, spin: -70 },
];

export default function FlavourCard({ flavour, index, isDarkSection = false }: { flavour: Flavour; index: number; isDarkSection?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const wash = useRef<HTMLSpanElement>(null);
  const doodles = useRef<HTMLDivElement>(null);
  const hover = useRef(false);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      const el = root.current;
      if (!el) return;
      const chars = gsap.utils.selector(el)("[data-char]");
      const bits = gsap.utils.toArray<HTMLElement>(doodles.current!.children);
      gsap.set(bits, { xPercent: (i) => DOODLE_OFFSETS[i].x, yPercent: (i) => DOODLE_OFFSETS[i].y, rotation: (i) => DOODLE_OFFSETS[i].spin });
      const enter = () => {
        hover.current = true;
        if (reduced) return;
        gsap.killTweensOf([wash.current, chars, bits]);
        gsap.fromTo(wash.current, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 0.5, ease: "power2.inOut" });
        gsap.to(chars, { yPercent: -100, duration: 0.5, ease: "power3.out", stagger: { each: 0.018, from: "start" } });
        gsap.to(bits, { xPercent: 0, yPercent: 0, rotation: 0, duration: 0.9, ease: "power3.out", stagger: 0.06, delay: 0.08 });
      };
      const leave = () => {
        hover.current = false;
        if (reduced) return;
        gsap.killTweensOf([wash.current, chars, bits]);
        gsap.to(wash.current, { clipPath: "circle(0% at 50% 50%)", duration: 0.9, ease: "power2.inOut" });
        gsap.to(chars, { yPercent: 0, duration: 0.45, ease: "power3.out", stagger: { each: 0.015, from: "end" } });
        gsap.to(bits, { xPercent: (i) => DOODLE_OFFSETS[i].x, yPercent: (i) => DOODLE_OFFSETS[i].y, rotation: (i) => DOODLE_OFFSETS[i].spin, duration: 0.7, ease: "power2.in", stagger: { each: 0.05, from: "end" } });
      };
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} style={{ "--flavour": flavour.color } as CSSProperties} className={`group h-[40vw] max-md:h-[80vw] p-[.7vw] max-md:p-[2.5vw] w-full bg-background max-md:rounded-2xl cursor-pointer ${isDarkSection ? "" : "max-md:bg-foreground"}`}>
      <div className="relative w-full h-[90%] max-md:h-[85%] flex items-center justify-center bg-light-beige rounded-lg max-md:rounded-xl overflow-hidden">
        <span ref={wash} aria-hidden style={{ clipPath: "circle(0% at 50% 50%)" }} className="pointer-events-none absolute inset-0 bg-(--flavour) will-change-[clip-path]" />
        <div ref={doodles} aria-hidden="true" className="pointer-events-none absolute inset-0 text-light-beige">
          <span className="absolute left-[-2vw] bottom-[-3vw] size-[12vw] max-md:size-[26vw] will-change-transform">
            <CoconutPiece3 opacity=".6" className="size-full rotate-25" />
          </span>
          <span className="absolute right-[-2vw] top-[-3vw] size-[11vw] max-md:size-[24vw] will-change-transform">
            <CoconutPiece3 opacity=".6" className="size-full -rotate-40" />
          </span>
          <span className="absolute right-[1.5vw] bottom-[1.5vw] size-[8vw] max-md:size-[18vw] will-change-transform">
            <CoconutPiece1 opacity=".6" className="size-full rotate-12" />
          </span>
          <span className="absolute left-[-1.5vw] top-[1vw] size-[8vw] max-md:size-[18vw] will-change-transform">
            <CoconutPiece1 opacity=".6" className="size-full rotate-15" />
          </span>
        </div>
        <CardCan texture={flavour.texture} index={index} hoverRef={hover} />
      </div>
      <div className="flex h-[10%] max-md:h-[15%] max-md:pt-[2vw] px-[.5vw] w-full justify-between items-center">
        <p className={`text36 font-patrick-hand text-foreground overflow-hidden ${isDarkSection ? "" : "max-md:text-light-beige"}`}>
          <span className="flex">
            {flavour.name.split("").map((ch, i) => (
              <span key={i} className="relative inline-block overflow-hidden">
                <span data-char className="block will-change-transform">
                  <span className="block whitespace-pre">{ch}</span>
                  <span className={`block whitespace-pre absolute top-full left-0 ${isDarkSection ? "text-light-brown" : "text-light-brown max-md:text-background"}`}>{ch}</span>
                </span>
              </span>
            ))}
          </span>
        </p>
        <AddButton flavour={flavour} className={`text-foreground ${isDarkSection ? "" : "max-md:text-light-beige"}`} />
      </div>
    </div>
  );
}
