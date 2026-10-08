"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FLAVOURS } from "@/lib/flavours";
import { prefersReducedMotion } from "@/lib/events";
import { AnimatedHeading, AnimatedParagraph } from "@/components/ui/AnimatedText";
import Button from "@/components/ui/Button";
import RoundButton from "@/components/ui/RoundButton";
import Scallops from "@/components/ui/Scallops";
import { ArrowLeft } from "@/components/ui/Icons";
import { TransitionLink } from "@/components/providers/PageTransition";

const CtaCan = dynamic(() => import("@/components/three/CtaCan"), { ssr: false });

const Bolts = () => (
  <>
    <span className="absolute left-[1.5vw] top-[1.5vw] size-[1vw] max-md:size-[3vw] rounded-full bg-foreground" />
    <span className="absolute right-[1.5vw] top-[1.5vw] size-[1vw] max-md:size-[3vw] rounded-full bg-foreground" />
    <span className="absolute bottom-[1.5vw] left-[1.5vw] size-[1vw] max-md:size-[3vw] rounded-full bg-foreground" />
    <span className="absolute bottom-[1.5vw] right-[1.5vw] size-[1vw] max-md:size-[3vw] rounded-full bg-foreground" />
  </>
);

/** Two bolted panels: the pitch on beige, the can on the flavour's colour with prev/next cycling. */
export default function Cta({ paddingTop = "" }: { paddingTop?: string }) {
  const [idx, setIdx] = useState(0);
  const flavour = FLAVOURS[idx];
  const spin = useRef(0);
  const hover = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const wash = useRef<HTMLSpanElement>(null);
  const target = useRef(0);
  const cur = useRef(0);
  const busy = useRef(false);
  const busyT = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (busyT.current) clearTimeout(busyT.current);
  }, []);

  const step = useCallback((dir: number) => {
    if (busy.current) return;
    const next = (cur.current + dir + FLAVOURS.length) % FLAVOURS.length;
    const reduced = prefersReducedMotion();
    cur.current = next;
    target.current = next;
    setIdx(next);
    const p = panel.current!;
    const w = wash.current!;
    if (reduced) {
      gsap.set(p, { backgroundColor: FLAVOURS[next].color });
      gsap.set(w, { clipPath: "circle(0% at 50% 50%)" });
    } else {
      gsap.killTweensOf(w);
      const pending = w.dataset.pending;
      if (pending) gsap.set(p, { backgroundColor: pending });
      w.dataset.pending = FLAVOURS[next].color;
      gsap.set(w, { backgroundColor: FLAVOURS[next].color, clipPath: "circle(0% at 50% 50%)" });
      gsap.to(w, {
        clipPath: "circle(75% at 50% 50%)",
        duration: 1.15,
        ease: "expo.out",
        onComplete: () => {
          gsap.set(p, { backgroundColor: FLAVOURS[next].color });
          gsap.set(w, { clipPath: "circle(0% at 50% 50%)" });
          delete w.dataset.pending;
        },
      });
    }
    if (!reduced) {
      busy.current = true;
      spin.current += dir;
      if (busyT.current) clearTimeout(busyT.current);
      busyT.current = setTimeout(() => {
        busy.current = false;
      }, 1150);
    }
  }, []);

  return (
    <section id="cta" className={`min-h-screen max-md:h-auto shrink-0 relative w-full z-10 bg-background paddx py-[4vw] pb-[8vw] max-md:pt-[8vw] max-md:pb-[20vw] flex items-center ${paddingTop}`}>
      <div className="relative z-20 h-full min-h-[70vh] max-md:h-auto w-full flex max-md:flex-col-reverse gap-[1.5vw] max-md:gap-[5vw]">
        <div className="relative w-1/2 max-md:w-full min-h-[70vh] max-md:min-h-0 max-md:h-[110vw] overflow-hidden rounded-[2vw] max-md:rounded-[6vw] border-4 border-foreground/60 bg-beige px-[4vw] py-[3vw] max-md:px-[7vw] max-md:py-[8vw] flex flex-col justify-center max-md:items-center max-md:text-center">
          <Bolts />
          <AnimatedParagraph delay={0.1} className="font-patrick-hand text32 uppercase opacity-70">
            straight from the shell
          </AnimatedParagraph>
          <AnimatedHeading as="h2" className="text180 mt-[min(1.5vw,2vh)] max-md:mt-[4vw] uppercase">
            THE BOX OF HEALTH.
          </AnimatedHeading>
          <AnimatedParagraph delay={0.25} className="text36 mt-[min(2vw,2.5vh)] max-md:mt-[5vw] w-[85%] max-md:w-full font-medium">
            Chilled, clean, ready to sip. Order before the batch runs dry.
          </AnimatedParagraph>
          <div className="mt-[min(3vw,3.5vh)] max-md:mt-[8vw] flex items-center gap-[2vw] max-md:gap-[2vw]">
            <TransitionLink href="/flavours">
              <Button title="Get Your Drink" />
            </TransitionLink>
            <TransitionLink href="/flavours">
              <Button title="Explore Flavors" />
            </TransitionLink>
          </div>
        </div>

        <div ref={panel} style={{ backgroundColor: FLAVOURS[0].color }} className="relative w-1/2 max-md:w-full min-h-[70vh] max-md:min-h-0 max-md:h-[110vw] overflow-hidden rounded-[2vw] max-md:rounded-[6vw] border-4 border-foreground/60 flex flex-col">
          <span ref={wash} aria-hidden style={{ clipPath: "circle(0% at 50% 50%)" }} className="pointer-events-none absolute inset-0 will-change-[clip-path]" />
          <Bolts />
          <p style={{ color: flavour.bgColor }} className="relative z-10 pt-[3vw] max-md:pt-[8vw] text-center font-patrick-hand text32 uppercase transition-colors duration-700">
            {flavour.fullName}
          </p>
          <div
            onPointerEnter={() => {
              hover.current = true;
            }}
            onPointerLeave={() => {
              hover.current = false;
            }}
            className="relative flex-1 min-h-[42vh] max-md:min-h-0 w-full"
          >
            <CtaCan targetRef={target} spinRef={spin} hoverRef={hover} />
            <RoundButton onClick={() => step(-1)} aria-label="Previous flavour" bgColor="var(--beige)" className="absolute! left-[2vw] max-md:left-[5vw] top-1/2 -translate-y-1/2 z-20 size-[5vw] max-md:size-12 bg-foreground border-2 border-foreground text-background hover:text-foreground">
              <div className="h-[1.2vw] w-[1.4vw] max-md:h-3.5 max-md:w-4 transition-colors duration-500">
                <ArrowLeft />
              </div>
            </RoundButton>
            <RoundButton onClick={() => step(1)} aria-label="Next flavour" bgColor="var(--beige)" className="absolute! right-[2vw] max-md:right-[5vw] top-1/2 -translate-y-1/2 z-20 size-[5vw] max-md:size-12 bg-foreground border-2 border-foreground text-background hover:text-foreground">
              <div className="h-[1.2vw] w-[1.4vw] max-md:h-3.5 max-md:w-4 rotate-180 transition-colors duration-500">
                <ArrowLeft />
              </div>
            </RoundButton>
          </div>
        </div>
      </div>
      <div className="absolute translate-y-[7.5vw] bottom-0 left-0 w-full h-fit pointer-events-none z-10">
        <Scallops bgColor="bg-background" />
      </div>
    </section>
  );
}
