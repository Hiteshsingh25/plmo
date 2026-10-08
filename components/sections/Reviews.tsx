"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { AnimatedHeading } from "@/components/ui/AnimatedText";
import { ArrowLeft, CoconutPiece3, ReviewQuote } from "@/components/ui/Icons";
import Parallax from "@/components/ui/Parallax";
import RoundButton from "@/components/ui/RoundButton";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP, Draggable, InertiaPlugin);

const REVIEWS = [
  { quote: "I just love the product.", handle: "@Theheartbrosco" },
  { quote: "Tastes like a holiday.", handle: "@coconutclub" },
  { quote: "My morning ritual now.", handle: "@sipwithsana" },
  { quote: "Clean, crisp, unreal.", handle: "@ravi.eats" },
  { quote: "Nothing else comes close.", handle: "@thegreenpantry" },
  { quote: "Finished the box in a week.", handle: "@dailydoseofmeher" },
];

function Arrows({ step, className = "" }: { step: (dir: number) => void; className?: string }) {
  return (
    <div className={className}>
      <RoundButton aria-label="Previous review" onClick={() => step(-1)} bgColor="var(--beige)" className="size-[5vw] max-md:size-12 bg-foreground border-2 border-foreground text-background hover:text-foreground">
        <div className="h-[1.2vw] w-[1.4vw] max-md:h-3.5 max-md:w-4 transition-colors duration-500">
          <ArrowLeft />
        </div>
      </RoundButton>
      <RoundButton aria-label="Next review" onClick={() => step(1)} bgColor="var(--beige)" className="size-[5vw] max-md:size-12 bg-foreground border-2 border-foreground text-background hover:text-foreground">
        <div className="h-[1.2vw] w-[1.4vw] max-md:h-3.5 max-md:w-4 rotate-180 transition-colors duration-500">
          <ArrowLeft />
        </div>
      </RoundButton>
    </div>
  );
}

/** Infinite, draggable testimonial track (3 copies, wrapped); cards tilt with drag velocity. */
export default function Reviews() {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const stepRef = useRef<((dir: number) => void) | null>(null);

  useGSAP(
    () => {
      const vp = viewport.current!;
      const tr = track.current!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", tr);
      const reduced = prefersReducedMotion();
      gsap.set(cards, { transformOrigin: "left top" });

      // a proxy element carries the raw x; the track gets the wrapped value
      const proxy = document.createElement("div");
      gsap.set(proxy, { x: 0 });
      let loop = 0;
      let cardStep = 0;
      let wrap = gsap.utils.wrap(0, 1);
      const render = () => gsap.set(tr, { x: wrap(gsap.getProperty(proxy, "x") as number) });
      const measure = () => {
        const gap = parseFloat(getComputedStyle(tr).columnGap) || 0;
        loop = (tr.scrollWidth + gap) / 3;
        cardStep = loop / REVIEWS.length;
        wrap = gsap.utils.wrap(-loop, 0);
        render();
      };
      measure();

      const drag = Draggable.create(proxy, {
        type: "x",
        trigger: vp,
        inertia: true,
        allowNativeTouchScrolling: true,
        cursor: "grab",
        activeCursor: "grabbing",
        onPress() {
          gsap.killTweensOf(proxy);
          this.update();
        },
        onDrag: render,
        onThrowUpdate: render,
      })[0];

      stepRef.current = (dir) => {
        gsap.killTweensOf(proxy);
        gsap.to(proxy, { x: (gsap.getProperty(proxy, "x") as number) - dir * cardStep, duration: 0.9, ease: "power3.out", onUpdate: render });
      };

      const spins = cards.map((c) => gsap.quickSetter(c, "rotation", "deg") as (v: number) => void);
      const tilt = cards.map(() => 0);
      const lag = cards.map((_, i) => 0.09 + (i % 3) * 0.02);
      let lastX = 0;
      const tick = () => {
        const x = gsap.getProperty(proxy, "x") as number;
        const dx = x - lastX;
        lastX = x;
        const target = gsap.utils.clamp(-10, 10, -(0.22 * dx));
        const r = gsap.ticker.deltaRatio();
        for (let i = 0; i < tilt.length; i++) {
          tilt[i] += (target - tilt[i]) * Math.min(1, lag[i] * r);
          spins[i](tilt[i]);
        }
      };
      if (!reduced) gsap.ticker.add(tick);
      const ro = new ResizeObserver(measure);
      ro.observe(vp);
      return () => {
        gsap.ticker.remove(tick);
        ro.disconnect();
        drag.kill();
        stepRef.current = null;
      };
    },
    { scope: viewport, dependencies: [] },
  );

  const step = (dir: number) => stepRef.current?.(dir);

  return (
    <section id="reviews" className="h-fit relative w-full bg-background z-10 overflow-x-clip pt-[2vw] pb-[8vw] max-md:pt-[6vh] max-md:pb-[10vh]">
      <div className="paddx relative z-10 flex w-full items-center max-md:justify-center justify-between max-md:gap-4">
        <AnimatedHeading as="h2" className="text180 uppercase">
          Sippers Say !
        </AnimatedHeading>
        <Arrows step={step} className="flex items-center max-md:hidden gap-[1vw] max-md:gap-3 max-md:shrink-0" />
      </div>
      <div ref={viewport} className="mt-[2vw] max-md:z-22 max-md:mt-0! relative z-22 w-full touch-pan-y py-[5vw] pl-[3vw] max-md:py-[6vh] max-md:pl-[5vw]">
        <div ref={track} className="flex w-max gap-[1.6vw] max-md:gap-4 will-change-transform">
          {Array.from({ length: 3 }).flatMap((_, copy) =>
            REVIEWS.map((r, i) => (
              <article
                key={`${copy}-${i}`}
                data-card
                className="relative z-10 flex h-[23vw] w-[27vw] shrink-0 select-none flex-col items-center justify-center rounded-[1.8vw] border-4 border-foreground/60 bg-background px-[2.5vw] text-center max-md:h-[42vw] max-md:w-[62vw] max-md:rounded-3xl max-md:px-6"
              >
                <span className="absolute left-[1.5vw] top-[1.5vw] size-[1.3vw] rounded-full bg-foreground max-md:left-4 max-md:top-4 max-md:size-2.5" />
                <span className="absolute right-[1.5vw] top-[1.5vw] size-[1.3vw] rounded-full bg-foreground max-md:right-4 max-md:top-4 max-md:size-2.5" />
                <ReviewQuote className="mb-[2vw] h-[3.5vw] w-[4.2vw] text-gold max-md:mb-4 max-md:h-7 max-md:w-8" />
                <h3 className="font-khand text52 font-semibold uppercase leading-[95%] tracking-[-0.02em]">{r.quote}</h3>
                <p className="mt-[1.4vw] max-md:mt-3 font-patrick-hand text36 leading-none">{r.handle}</p>
              </article>
            )),
          )}
        </div>
      </div>
      <Arrows step={step} className="items-center max-md:flex justify-center hidden gap-[1vw] max-md:gap-3 max-md:shrink-0" />
      <Parallax speed={0.1} rotate={10} className="absolute right-[5vw] text-light-beige rotate-10 z-20 bottom-[8vw] size-[25vw] max-md:size-[45vw] max-md:right-[-12vw] max-md:bottom-[-4vw]">
        <CoconutPiece3 opacity=".7" />
      </Parallax>
    </section>
  );
}
