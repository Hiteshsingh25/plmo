"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { formatPrice, MAX_QTY, useCart, type CartLine } from "@/lib/cart";
import { prefersReducedMotion } from "@/lib/events";
import { CoconutPiece1, CoconutPiece3, Plus, Smily } from "@/components/ui/Icons";
import { TransitionLink } from "@/components/providers/PageTransition";

gsap.registerPlugin(useGSAP);

const dur = (d: number) => (prefersReducedMotion() ? 0.001 : d);
const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/* ── collapsible block ──────────────────────────────────────────────── */
function Collapse({ open, instant = false, className = "", children }: { open: boolean; instant?: boolean; className?: string; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const last = useRef<boolean | null>(null);
  useGSAP(
    () => {
      const t = el.current;
      if (!t || (!first.current && last.current === open)) return;
      gsap.killTweensOf(t);
      const snap = first.current || instant;
      first.current = false;
      last.current = open;
      if (snap) gsap.set(t, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0 });
      else gsap.to(t, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0, duration: dur(open ? 0.5 : 0.38), ease: open ? "power3.out" : "power2.inOut" });
    },
    { dependencies: [open, instant] },
  );
  return (
    <div ref={el} style={{ height: 0, visibility: "hidden" }} className={`overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

const Row = ({ label, muted = false, children }: { label: string; muted?: boolean; children: ReactNode }) => (
  <div className={`flex items-baseline justify-between ${muted ? "text-light-beige/60" : ""}`}>
    <p className="text32 font-patrick-hand">{label}</p>
    <p className="text32 font-patrick-hand tabular-nums">{children}</p>
  </div>
);

function Price({ value, className = "", style }: { value: number; className?: string; style?: CSSProperties }) {
  const el = useRef<HTMLSpanElement>(null);
  const n = useRef({ n: value });
  useGSAP(
    () => {
      const t = el.current;
      if (!t || n.current.n === value) return;
      gsap.killTweensOf(n.current);
      gsap.to(n.current, {
        n: value,
        duration: dur(0.45),
        ease: "power2.out",
        onUpdate: () => {
          t.textContent = formatPrice(n.current.n);
        },
        onComplete: () => {
          n.current.n = value;
          t.textContent = formatPrice(value);
        },
      });
    },
    { dependencies: [value] },
  );
  return (
    <span ref={el} className={`tabular-nums ${className}`} style={style}>
      {formatPrice(value)}
    </span>
  );
}

/* ── one basket line ────────────────────────────────────────────────── */
function LineItem({ line, open, justAdded, onQty, onRemove }: { line: CartLine; open: boolean; justAdded: boolean; onQty: (id: string, q: number) => void; onRemove: (id: string) => void }) {
  const li = useRef<HTMLLIElement>(null);
  const qtyEl = useRef<HTMLSpanElement>(null);
  const { flavour, pack, qty, total } = line;
  const maxed = qty >= MAX_QTY;
  const mountedOpen = useRef(open);
  const firstQty = useRef(true);

  useGSAP(() => {
    if (mountedOpen.current && li.current) {
      gsap.from(li.current, { height: 0, paddingTop: 0, paddingBottom: 0, x: 40, autoAlpha: 0, duration: dur(0.55), ease: "power3.out", clearProps: "height,paddingTop,paddingBottom" });
    }
  }, []);
  useGSAP(
    () => {
      if (justAdded && li.current) {
        gsap.fromTo(li.current, { backgroundColor: "rgba(255,227,134,0.22)" }, { backgroundColor: "rgba(255,227,134,0)", duration: dur(1.1), ease: "sine.out" });
      }
    },
    { dependencies: [justAdded], scope: li },
  );
  useGSAP(
    () => {
      if (firstQty.current) {
        firstQty.current = false;
        return;
      }
      if (qtyEl.current) gsap.fromTo(qtyEl.current, { scale: 1.45 }, { scale: 1, duration: dur(0.5), ease: "back.out(3)", overwrite: "auto" });
    },
    { dependencies: [qty] },
  );

  const remove = () => {
    if (!li.current) return onRemove(line.id);
    gsap.to(li.current, { x: 60, autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, borderBottomWidth: 0, duration: dur(0.38), ease: "power2.inOut", overwrite: "auto", onComplete: () => onRemove(line.id) });
  };

  return (
    <li ref={li} style={{ "--flavour": flavour.color } as CSSProperties} className="group/row flex items-center gap-[1vw] max-md:gap-4 overflow-hidden rounded-lg border-b border-light-beige/10 py-[1vw] max-md:py-4 last:border-b-0">
      <div className="relative flex size-[4.5vw] max-md:size-18 shrink-0 items-center justify-center overflow-hidden rounded-md bg-(--flavour) transition-transform duration-500 ease-out group-hover/row:scale-105 group-hover/row:-rotate-3">
        <span className="absolute inset-0 opacity-30">
          <CoconutPiece3 opacity=".5" className="size-full" />
        </span>
        <span className="relative font-patrick-hand text-light-beige tabular-nums" style={{ fontSize: "min(1.6vw, 2.4vh)" }}>
          {pack.cans}×
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text32 truncate font-patrick-hand">{flavour.name}</p>
        <p className="font-patrick-hand text-light-beige/55 tabular-nums" style={{ fontSize: "min(0.85rem, 1.9vh)" }}>
          {pack.label} · {formatPrice(line.unitPrice)}
        </p>
        <div className="mt-[0.4vw] max-md:mt-2 flex items-center gap-[0.6vw] max-md:gap-3">
          <div className="flex items-center gap-[0.5vw] max-md:gap-2 rounded-full border border-light-beige/25 px-[0.5vw] py-[0.15vw] max-md:px-2.5 max-md:py-1 transition-colors duration-300 group-hover/row:border-light-beige/45">
            <button type="button" onClick={() => (qty === 1 ? remove() : onQty(line.id, qty - 1))} tabIndex={open ? 0 : -1} aria-label={qty === 1 ? `Remove ${flavour.name}` : `Fewer ${flavour.name}`} className="cursor-pointer leading-none opacity-70 transition-all duration-200 hover:opacity-100 active:scale-75" style={{ fontSize: "min(1rem, 2.2vh)" }}>
              −
            </button>
            <span ref={qtyEl} className="inline-block min-w-[1.2em] text-center font-patrick-hand tabular-nums" style={{ fontSize: "min(1rem, 2.2vh)" }}>
              {qty}
            </span>
            <button type="button" onClick={() => onQty(line.id, qty + 1)} disabled={maxed} tabIndex={open && !maxed ? 0 : -1} aria-label={maxed ? `${flavour.name} at maximum quantity` : `More ${flavour.name}`} className="cursor-pointer leading-none opacity-70 transition-all duration-200 hover:opacity-100 active:scale-75 disabled:cursor-not-allowed disabled:opacity-25 disabled:active:scale-100" style={{ fontSize: "min(1rem, 2.2vh)" }}>
              +
            </button>
          </div>
          <button type="button" onClick={remove} tabIndex={open ? 0 : -1} className="cursor-pointer font-patrick-hand text-light-beige/40 underline underline-offset-2 transition-colors duration-300 hover:text-beige" style={{ fontSize: "min(0.8rem, 1.8vh)" }}>
            Remove
          </button>
        </div>
      </div>
      <Price value={total} className="text32 shrink-0 font-patrick-hand" />
    </li>
  );
}

/* ── drawer ─────────────────────────────────────────────────────────── */
export default function CartDrawer() {
  const { lines, count, cans, subtotal, shipping, total, freeShippingGap, freeShippingProgress, open, closeCart, setQty, remove, clear, lastAdded, ready } = useCart();
  const filled = ready && count > 0;
  const [note, setNote] = useState(false);
  const aside = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const notePanel = useRef<HTMLDivElement>(null);
  const noteTl = useRef<gsap.core.Timeline | null>(null);
  const checkoutBtn = useRef<HTMLButtonElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const ul = useRef<HTMLUListElement>(null);
  const empty = useRef<HTMLDivElement>(null);
  const emptyIcon = useRef<HTMLSpanElement>(null);
  const foot = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const t = gsap.timeline({ paused: true });
      t.set([scrim.current, aside.current], { autoAlpha: 1 })
        .fromTo(scrim.current, { opacity: 0 }, { opacity: 1, duration: dur(0.7), ease: "power2.out" }, 0)
        .fromTo(aside.current, { clipPath: "ellipse(0% 65% at 105% 50%)" }, { clipPath: "ellipse(150% 120% at 105% 50%)", duration: dur(1.15), ease: "power3.inOut" }, 0)
        .fromTo([head.current, list.current, foot.current], { x: 28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: dur(0.55), ease: "power3.out", stagger: 0.07 }, 0.42);
      tl.current = t;
    },
    { scope: aside },
  );

  const everOpened = useRef(false);
  useGSAP(
    () => {
      const t = tl.current;
      if (!t || (!open && !everOpened.current)) return;
      everOpened.current = true;
      const a = aside.current;
      const s = scrim.current;
      gsap.set([a, s], { willChange: "clip-path, opacity, transform" });
      const relax = () => gsap.set([a, s], { willChange: "auto" });
      t.eventCallback("onComplete", relax);
      t.eventCallback("onReverseComplete", relax);
      if (open) {
        lenis?.stop();
        t.timeScale(1).play();
      } else {
        lenis?.start();
        t.timeScale(1.25).reverse();
      }
    },
    { dependencies: [open, lenis] },
  );

  useGSAP(
    () => {
      const p = notePanel.current;
      if (!p) return;
      const t = gsap.timeline({ paused: true });
      t.set(p, { autoAlpha: 1 })
        .fromTo(p, { clipPath: "ellipse(0% 0% at 50% 108%)" }, { clipPath: "ellipse(160% 160% at 50% 108%)", duration: dur(0.75), ease: "power3.inOut" }, 0)
        .fromTo(p.querySelectorAll("[data-note-item]"), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: dur(0.5), ease: "power3.out", stagger: 0.08 }, 0.28);
      noteTl.current = t;
    },
    { scope: aside },
  );

  const noteFirst = useRef(true);
  useGSAP(
    () => {
      const t = noteTl.current;
      if (!t) return;
      if (noteFirst.current) {
        noteFirst.current = false;
        return;
      }
      if (!open) {
        t.pause(0);
        gsap.set(notePanel.current, { autoAlpha: 0, clipPath: "ellipse(0% 0% at 50% 108%)" });
        return;
      }
      if (note) t.timeScale(1).play();
      else t.timeScale(1.3).reverse();
    },
    { dependencies: [note, open] },
  );

  // closing resets the disclaimer
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setNote(false);
  }

  useGSAP(
    () => {
      const items = ul.current?.children;
      if (open && items?.length) gsap.fromTo(items, { x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: dur(0.55), ease: "power3.out", stagger: 0.05, delay: 0.55, overwrite: "auto" });
    },
    { dependencies: [open] },
  );

  const lastFilled = useRef<boolean | null>(null);
  useGSAP(
    () => {
      const e = empty.current;
      const icon = emptyIcon.current;
      if (!e) return;
      if (lastFilled.current !== filled) {
        const initial = lastFilled.current === null;
        lastFilled.current = filled;
        if (initial || !open) gsap.set(e, { autoAlpha: filled ? 0 : 1, y: 0, scale: 1 });
        else if (filled) gsap.to(e, { autoAlpha: 0, y: -14, duration: dur(0.28), ease: "power2.in", overwrite: "auto" });
        else gsap.fromTo(e, { autoAlpha: 0, y: 22, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: dur(0.6), ease: "power3.out", delay: 0.2, overwrite: "auto" });
      }
      if (icon) {
        gsap.killTweensOf(icon);
        if (!filled && open) gsap.to(icon, { y: -10, rotate: 5, duration: dur(2.6), ease: "sine.inOut", repeat: -1, yoyo: true });
        else gsap.set(icon, { y: 0, rotate: 0 });
      }
    },
    { dependencies: [filled, open] },
  );

  // focus management
  useEffect(() => {
    if (!open) return;
    const a = aside.current;
    const b = body.current;
    if (!a || !b) return;
    const prev = document.activeElement as HTMLElement | null;
    (b.querySelector(FOCUSABLE) as HTMLElement | null)?.focus({ preventScroll: true });
    return () => {
      if (a.contains(document.activeElement)) prev?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scope = note ? notePanel.current : body.current;
    if (!scope) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return note ? setNote(false) : closeCart();
      if (e.key !== "Tab") return;
      const items = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, note, closeCart]);

  const noteWasOpen = useRef(false);
  useEffect(() => {
    if (note) {
      noteWasOpen.current = true;
      (notePanel.current?.querySelector(FOCUSABLE) as HTMLElement | null)?.focus({ preventScroll: true });
    } else if (noteWasOpen.current && open) checkoutBtn.current?.focus({ preventScroll: true });
  }, [note, open]);

  const clearAll = useCallback(() => {
    const items = ul.current?.children;
    if (items?.length) {
      gsap.to(items, { x: 56, autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, borderBottomWidth: 0, duration: dur(0.32), stagger: { each: 0.045, from: "end" }, ease: "power2.in", onComplete: clear });
    } else clear();
  }, [clear]);

  return (
    <>
      <div ref={scrim} onClick={closeCart} aria-hidden style={{ visibility: "hidden" }} className={`fixed inset-0 z-800 bg-foreground/50 backdrop-blur-sm ${open ? "pointer-events-auto" : "pointer-events-none"}`} />
      <aside
        ref={aside}
        role="dialog"
        aria-modal="true"
        aria-label="Your basket"
        aria-hidden={!open}
        style={{ clipPath: "ellipse(0% 65% at 105% 50%)", visibility: "hidden" }}
        className={`fixed right-0 top-0 z-900 h-full w-[32vw] max-md:w-full border-l border-light-beige/20 bg-foreground text-light-beige ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden text-light-beige" aria-hidden>
          <span className="absolute right-[-4vw] top-[-3vw] size-[16vw] max-md:size-[40vw]">
            <CoconutPiece3 opacity=".07" className="size-full -rotate-30" />
          </span>
          <span className="absolute left-[-3vw] bottom-[18vh] size-[13vw] max-md:size-[34vw]">
            <CoconutPiece1 opacity=".07" className="size-full rotate-20" />
          </span>
        </div>

        <div ref={body} inert={note} className="relative z-10 flex h-full flex-col">
          <header ref={head} className="relative z-10 flex shrink-0 items-start justify-between px-[2vw] pt-[2.2vw] pb-[1.2vw] max-md:px-6 max-md:pt-8 max-md:pb-4">
            <div>
              <p className="text150 leading-none" style={{ fontSize: "min(3.4vw, 5vh)" }}>
                Basket
              </p>
              <p className="text32 font-patrick-hand text-beige/80 tabular-nums">{filled ? `${count} ${count === 1 ? "pack" : "packs"} · ${cans} cans` : "Nothing poured yet"}</p>
            </div>
            <button type="button" onClick={closeCart} aria-label="Close basket" tabIndex={open ? 0 : -1} className="group flex size-[2.4vw] max-md:size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-light-beige/30 transition-all duration-300 hover:bg-light-beige hover:text-foreground active:scale-90">
              <Plus className="size-[1.1vw] max-md:size-4 rotate-45 transition-transform duration-500 group-hover:rotate-135" />
            </button>
          </header>

          <Collapse open={filled} instant={!open} className="relative z-10 shrink-0">
            <div className="px-[2vw] pb-[1.2vw] max-md:px-6 max-md:pb-4">
              <p className="font-patrick-hand text-beige tabular-nums" style={{ fontSize: "min(0.95rem, 2.2vh)" }}>
                {freeShippingGap > 0 ? `${formatPrice(freeShippingGap)} away from free shipping` : "Free shipping unlocked"}
              </p>
              <div className="mt-[0.5vw] max-md:mt-2 h-[0.35vw] max-md:h-1.5 w-full overflow-hidden rounded-full bg-light-beige/15">
                <span className="block h-full rounded-full bg-beige transition-[width] duration-700 ease-out" style={{ width: `${100 * freeShippingProgress}%` }} />
              </div>
            </div>
          </Collapse>

          <div ref={list} data-lenis-prevent className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-[2vw] max-md:px-6">
            <ul ref={ul} className="flex flex-col">
              {lines.map((l) => (
                <LineItem key={l.id} line={l} open={open} justAdded={lastAdded?.id === l.id} onQty={setQty} onRemove={remove} />
              ))}
            </ul>
            <div ref={empty} aria-hidden={filled} style={{ visibility: "hidden" }} className={`absolute inset-0 flex flex-col items-center justify-center gap-[0.8vw] max-md:gap-3 px-[2vw] max-md:px-6 text-center ${filled ? "pointer-events-none" : "pointer-events-auto"}`}>
              <span ref={emptyIcon} className="size-[7vw] max-md:size-24 opacity-40">
                <CoconutPiece1 opacity=".9" className="size-full" />
              </span>
              <p className="text36 font-patrick-hand text-light-beige/70">Your basket is thirsty.</p>
              <TransitionLink href="/flavours" onClick={closeCart} tabIndex={open && !filled ? 0 : -1} className="text32 cursor-pointer font-patrick-hand text-beige underline underline-offset-4 transition-opacity duration-300 hover:opacity-70">
                Go pick a flavour
              </TransitionLink>
            </div>
          </div>

          <footer ref={foot} className="relative z-10 shrink-0 border-t border-light-beige/15 px-[2vw] pb-[2vw] pt-[1.2vw] max-md:px-6 max-md:pb-8 max-md:pt-4">
            <Collapse open={filled} instant={!open}>
              <Row label="Subtotal">
                <Price value={subtotal} />
              </Row>
              <Row label="Shipping" muted>
                {shipping === 0 ? "Free" : <Price value={shipping} />}
              </Row>
              <div className="my-[0.8vw] max-md:my-3 h-px w-full bg-light-beige/15" />
            </Collapse>
            <div className="flex items-baseline justify-between">
              <p className="text36 font-patrick-hand">Total</p>
              <Price value={filled ? total : 0} className="text150" style={{ fontSize: "min(2.4vw, 4vh)" }} />
            </div>
            <button
              ref={checkoutBtn}
              type="button"
              onClick={() => setNote(true)}
              disabled={!filled}
              tabIndex={open && filled ? 0 : -1}
              className="mt-[1vw] max-md:mt-4 w-full cursor-pointer rounded-md bg-beige py-[0.8vw] max-md:py-3.5 text36 font-patrick-hand text-foreground transition-all duration-300 hover:bg-light-beige hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
            >
              Checkout
            </button>
            <Collapse open={filled} instant={!open}>
              <button type="button" onClick={clearAll} tabIndex={open && filled ? 0 : -1} className="mt-[0.5vw] max-md:mt-2 w-full cursor-pointer font-patrick-hand text-light-beige/50 transition-colors duration-300 hover:text-light-beige" style={{ fontSize: "min(0.9rem, 2vh)" }}>
                Empty the basket
              </button>
            </Collapse>
          </footer>
        </div>

        {/* concept-shop disclaimer */}
        <div
          ref={notePanel}
          role="alertdialog"
          aria-modal="true"
          aria-label="About checkout"
          aria-hidden={!note}
          inert={!note}
          style={{ clipPath: "ellipse(0% 0% at 50% 108%)", visibility: "hidden" }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-[1.1vw] max-md:gap-5 bg-foreground px-[3vw] max-md:px-8 text-center text-light-beige"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <span className="absolute left-[-5vw] top-[-4vw] size-[18vw] max-md:size-[44vw]">
              <CoconutPiece3 opacity=".07" className="size-full rotate-12" />
            </span>
            <span className="absolute right-[-4vw] bottom-[-3vw] size-[15vw] max-md:size-[38vw]">
              <CoconutPiece1 opacity=".07" className="size-full -rotate-12" />
            </span>
          </div>
          <span data-note-item className="relative size-[4.5vw] max-md:size-16 text-beige">
            <Smily className="size-full" opacity=".9" />
          </span>
          <p data-note-item className="relative text150 leading-none" style={{ fontSize: "min(3vw, 4.5vh)" }}>
            No till at the end
          </p>
          <p data-note-item className="relative text32 max-w-[24vw] max-md:max-w-none font-patrick-hand text-light-beige/70">
            Palmo is a concept piece — the shop front is real, the shop is not. Nothing was charged and nothing is on its way. Your basket stays exactly where you left it.
          </p>
          <button data-note-item type="button" onClick={() => setNote(false)} className="relative mt-[0.6vw] max-md:mt-2 cursor-pointer rounded-md bg-beige px-[1.6vw] py-[0.7vw] max-md:px-8 max-md:py-3 text36 font-patrick-hand text-foreground hover:bg-light-beige hover:-translate-y-px active:translate-y-0 active:scale-[0.98]">
            Back to the basket
          </button>
        </div>
      </aside>
    </>
  );
}
