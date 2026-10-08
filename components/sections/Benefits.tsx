"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatedHeading, AnimatedParagraph } from "@/components/ui/AnimatedText";
import DrawSVG from "@/components/ui/DrawSVG";
import { Waves } from "@/components/ui/Icons";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function StatBadge({ value, unit, label, variant = "light", className = "" }: { value: string; unit?: string; label?: string; variant?: "light" | "dark"; className?: string }) {
  const dark = variant === "dark";
  return (
    <div
      className={`rounded-full border-4 ${dark ? "border-beige bg-light-brown text-beige" : "border-foreground bg-beige text-foreground"} aspect-square flex flex-col size-[15vw] max-md:size-[30vw] max-md:border-2 items-center justify-center text-center p-[1vw] max-md:p-2 select-none ${className}`}
    >
      <div className="flex font-semibold items-baseline justify-center leading-none font-khand tracking-tighter">
        <span className="text-[4.2vw] max-md:text-[9vw]">{value}</span>
        {unit && <span className="text-[2.3rem] max-md:text-[4.5vw] uppercase">{unit}</span>}
      </div>
      {label && <p className="text36 max-md:text-[3.2vw] font-inter font-medium leading-tight mt-[-.5vw] max-md:mt-0">{label}</p>}
    </div>
  );
}

const AMPLITUDE = [0.25, 0.3, 0.27, 0.38];
const TILT = [-45, 40, -50, 48];

/** 320vh pinned stage: four stat badges arc up past the coconut on alternating sides. */
export default function Benefits() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const boxes = gsap.utils.toArray<HTMLElement>(".curved-scroll-box");
      const reduced = prefersReducedMotion();
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: true } });
      boxes.forEach((box, i) => {
        const left = i % 2 === 0;
        const at = 0.3 * i;
        const tilt = TILT[i % TILT.length] || 15;
        if (reduced) {
          tl.fromTo(box, { y: "50vh", x: 0, rotate: 0 }, { y: "-50vh", ease: "none", duration: 1 }, at);
          return;
        }
        const reach = () => {
          const amp = AMPLITUDE[i % AMPLITUDE.length] || 0.25;
          if (!window.matchMedia("(max-width: 1024px)").matches) return window.innerWidth * amp;
          const w = stage.current?.offsetWidth || window.innerWidth;
          const max = Math.max(0, w / 2 - box.offsetWidth / 2 - 0.02 * w);
          return Math.min(w * amp, max);
        };
        tl.fromTo(
          box,
          { y: "70vh", x: 0, rotate: 0 },
          {
            y: "-70vh",
            ease: "none",
            duration: 1,
            onUpdate() {
              const a = this.progress() * Math.PI;
              const x = Math.sin(a) * reach();
              gsap.set(box, { x: left ? -x : x, rotate: Math.sin(a) * tilt });
            },
          },
          at,
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="benefits" className="h-[320vh] bg-background relative paddx w-full">
      <h2 className="text180 pt-[6vw] max-md:pt-[18vh] uppercase w-full leading-[85%] relative">
        <span className="grid w-full grid-cols-[1fr_auto_1fr] items-center max-md:flex max-md:flex-col max-md:items-center max-md:w-full">
          <AnimatedHeading as="span" className="whitespace-nowrap text-left max-md:block max-md:w-full max-md:text-center">
            The real
          </AnimatedHeading>
          <DrawSVG className="heading-waves w-[28vw] p-[1vw] translate-y-[-1.5vw] translate-x-[-1.5vw] text-beige max-md:hidden" scrub={false} start="top 80%" stagger="sequential">
            <Waves className="w-full" />
          </DrawSVG>
          <AnimatedHeading as="span" className="whitespace-nowrap text-right max-md:block max-md:w-full max-md:text-center">
            Source of
          </AnimatedHeading>
        </span>
        <span className="block text-right mr-[14vw] mt-[-3.5vw] whitespace-nowrap max-md:text-center max-md:mr-0 max-md:mt-0 max-md:w-full">
          <AnimatedHeading as="span" className="inline-block max-md:block max-md:w-full">
            every Sip.
          </AnimatedHeading>
        </span>
      </h2>
      <AnimatedParagraph delay={0.25} className="text36 max-md:text-center font-medium font-sans capitalize w-[25vw] absolute left-[3.5vw] top-[24vw] max-md:static max-md:w-[85%] max-md:mx-auto max-md:mt-6">
        For centuries, coconuts have carried their own perfectly balanced source of refreshment.
      </AnimatedParagraph>
      <div ref={stage} className="h-screen w-full sticky mt-[10vw] max-md:mt-[12vh] py-[6vw] top-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <StatBadge className="curved-scroll-box absolute" variant="light" value="500" unit="MG" label="Of Potassium" />
        <StatBadge className="curved-scroll-box absolute" variant="dark" value="100%" unit="" label="Natural Hydration" />
        <StatBadge className="curved-scroll-box absolute" variant="dark" value="0" unit="GM" label="Of Sugar" />
        <StatBadge className="curved-scroll-box absolute" variant="light" value="45" unit="KCL" label="Per 200Ml" />
      </div>
    </section>
  );
}
