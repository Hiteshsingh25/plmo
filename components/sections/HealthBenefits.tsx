"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { AnimatedHeading, AnimatedParagraph } from "@/components/ui/AnimatedText";
import Button from "@/components/ui/Button";
import { CoconutPiece3 } from "@/components/ui/Icons";
import Parallax from "@/components/ui/Parallax";
import { TransitionLink } from "@/components/providers/PageTransition";

gsap.registerPlugin(InertiaPlugin);

const PHOTOS = [
  { src: "/img/coconut-holding.webp", alt: "Fresh harvested coconut held in hand", rotation: 13, className: "right-[-8vw] top-0" },
  { src: "/img/bunch-of-coconut.webp", alt: "Organic fresh coconuts bunched on palm grove floor", rotation: 0, className: "right-[8vw] z-2 bottom-[4vw]" },
  { src: "/img/good-coconut.webp", alt: "Clean ripe coconut showing natural golden husk texture", rotation: -9, className: "right-[30vw] z-3 top-[4vw]" },
];

/** Mission copy + three polaroids that get nudged by the pointer and settle back with inertia. */
export default function HealthBenefits() {
  const gallery = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = gallery.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];
    root.querySelectorAll<HTMLElement>(".media-item").forEach((item) => {
      let lx = 0;
      let ly = 0;
      let vx = 0;
      let vy = 0;
      const rest = parseFloat(item.dataset.rotation || "0") || 0;
      gsap.set(item, { rotation: rest, x: 0, y: 0 });
      const move = (e: MouseEvent) => {
        vx = e.clientX - lx;
        vy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
      };
      const enter = (e: MouseEvent) => {
        gsap.killTweensOf(item);
        vx = 0;
        vy = 0;
        lx = e.clientX;
        ly = e.clientY;
      };
      const leave = () => {
        gsap.to(item, {
          inertia: { x: { velocity: 30 * vx, end: 0 }, y: { velocity: 30 * vy, end: 0 }, rotation: { velocity: 2 * vx, end: rest }, resistance: 150 },
          force3D: true,
        });
      };
      item.addEventListener("mousemove", move);
      item.addEventListener("mouseenter", enter);
      item.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        gsap.killTweensOf(item);
        item.removeEventListener("mousemove", move);
        item.removeEventListener("mouseenter", enter);
        item.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section id="health-benifts" className="h-fit relative z-1 bg-background overflow-x-clip paddx max-md:px-0! pt-[20vw] py-[10vw] w-full">
      <AnimatedHeading as="h2" className="text180 px-[10vw] max-md:w-full max-md:px-0! uppercase text-center">
        you deserve the best for your health.
      </AnimatedHeading>
      <div className="flex h-screen items-start max-md:flex-col-reverse max-md:h-auto max-md:gap-[8vw] max-md:overflow-x-hidden! max-md:z-20! relative justify-between">
        <div className="relative z-10 flex flex-col w-[38vw] items-start max-md:items-center max-md:w-full max-md:mx-auto space-y-[2vw] pt-[10vw] max-md:pt-0 max-md:space-y-6">
          <AnimatedParagraph delay={0.15} className="text36 max-md:text-center max-md:w-[90%] font-medium">
            We want to make healthy, science-backed nutrition simple and accessible so you can feel better, perform better, and enjoy life every single day.
          </AnimatedParagraph>
          <TransitionLink href="/flavours">
            <Button title="Get Your Drink" />
          </TransitionLink>
        </div>
        <div ref={gallery} className="w-full max-md:mt-[10vw] h-full relative max-md:flex max-md:h-[58vw] max-md:overflow-x-clip max-md:flex-row-reverse max-md:items-center max-md:justify-center">
          {PHOTOS.map((p) => (
            <div
              key={p.src}
              data-rotation={p.rotation}
              className={`media-item h-[42vw] p-[1vw] w-[30vw] absolute bg-light-beige max-md:relative max-md:right-auto max-md:top-auto max-md:bottom-auto max-md:mx-[-5vw] max-md:h-[52vw] max-md:w-[38vw] max-md:p-[2vw] ${p.className}`}
            >
              <div className="h-full w-full relative bg-foreground">
                <Image alt={p.alt} src={p.src} fill sizes="(max-width: 1024px) 38vw, 30vw" className="h-full w-full object-cover" />
              </div>
            </div>
          ))}
        </div>
        <Parallax speed={-0.08} rotate={20} className="pointer-events-none absolute max-md:size-[35vw] rotate-80 text-light-beige bottom-[10vw] left-[5vw] z-0 size-[20vw]">
          <CoconutPiece3 opacity="1" className="size-full" />
        </Parallax>
      </div>
    </section>
  );
}
