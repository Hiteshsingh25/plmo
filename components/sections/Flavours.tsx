"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLAVOURS } from "@/lib/flavours";
import { prefersReducedMotion } from "@/lib/events";
import AnimatedText from "@/components/ui/AnimatedText";
import { Chakra, CoconutPiece3 } from "@/components/ui/Icons";
import Parallax from "@/components/ui/Parallax";
import Scallops from "@/components/ui/Scallops";
import FlavourCard from "./FlavourCard";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FEATURED = FLAVOURS.slice(0, 3);

/** Dark band: "EXPLORE ALL ✺ FLAVOURS" with a scroll-spun sunburst and three product cards. */
export default function Flavours() {
  const root = useRef<HTMLElement>(null);
  const chakra = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.to(chakra.current, { rotation: 360, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="flavours" data-nav-dark="0 7" className="h-fit z-10 mt-[-2vw] max-md:mt-[-14vw] pb-[7vw] text-background relative w-full bg-foreground">
      <div className="paddx flex gap-[4vw] max-md:gap-[8vw] flex-col items-center justify-between h-full py-[10vw]">
        <h2 className="text180 max-md:hidden flex items-center justify-between text-center w-full uppercase">
          <AnimatedText variant="heading">Explore all</AnimatedText>
          <span ref={chakra} className="size-[8vw] inline-block will-change-transform">
            <Chakra className="size-full max-md:hidden" />
          </span>
          <AnimatedText variant="heading" from="end">
            flavours
          </AnimatedText>
        </h2>
        <h2 className="text180 hidden max-md:text-center w-full max-md:block uppercase">
          Explore <br /> all flavours
        </h2>
        <div className="flex max-md:flex-col items-center max-md:gap-[4vw] gap-[1vw] w-full justify-between">
          {FEATURED.map((f, i) => (
            <FlavourCard key={f.id} flavour={f} index={i} isDarkSection />
          ))}
        </div>
        <Parallax speed={-0.08} rotate={20} className="absolute max-md:size-[52vw] text-light-beige size-[16vw] bottom-[4vw] max-md:bottom-[2vw] max-md:right-[-4vw] z-100 right-[5vw]">
          <CoconutPiece3 className="size-full" />
        </Parallax>
      </div>
      <div className="absolute translate-y-[7.5vw] bottom-0 left-0 w-full h-fit">
        <Scallops />
      </div>
    </section>
  );
}
