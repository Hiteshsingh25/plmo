import type { Metadata } from "next";
import Image from "next/image";
import { AnimatedHeading, AnimatedParagraph } from "@/components/ui/AnimatedText";
import Button from "@/components/ui/Button";
import DrawSVG from "@/components/ui/DrawSVG";
import { ArrowDoodle, CoconutPiece2, Waves } from "@/components/ui/Icons";
import PalmTree from "@/components/ui/PalmTree";
import Parallax from "@/components/ui/Parallax";
import Scallops from "@/components/ui/Scallops";
import { TransitionLink } from "@/components/providers/PageTransition";
import Cta from "@/components/sections/Cta";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = { title: "Palmo | Our Story" };

const BEATS = [
  { n: "01", title: "Picked ripe", copy: "Green coconuts come down from coastal palms at seven months — the moment the water is sweetest and the flesh is still soft." },
  { n: "02", title: "Opened within a day", copy: "No warehouses, no waiting. Every coconut is cracked, pressed and chilled before the sun sets on the day it was cut." },
  { n: "03", title: "Never concentrated", copy: "We do not boil it down and add water back. What is in the can is what was in the shell, plus real fruit where the label says so." },
];

const PHOTOS = ["/img/coconut-holding.webp", "/img/bunch-of-coconut.webp", "/img/good-coconut.webp"];

export default function StoryPage() {
  return (
    <>
      <main id="main-content" className="flex-1 overflow-x-clip w-full relative">
        <section className="paddx bg-background relative w-full min-h-screen pt-[12vw] pb-[8vw] max-md:pt-[26vw] overflow-x-hidden">
          <AnimatedHeading as="h1" className="text180 uppercase w-[60vw] max-md:w-full max-md:text-center">
            Straight from the shell.
          </AnimatedHeading>
          <div className="mt-[3vw] flex items-start gap-[3vw] max-md:flex-col max-md:items-center max-md:text-center">
            <DrawSVG trigger="loader" delay={0.8}>
              <ArrowDoodle className="size-[7vw] -rotate-5 text-gold max-md:hidden" />
            </DrawSVG>
            <AnimatedParagraph delay={0.2} className="text36 w-[34vw] font-medium max-md:w-full">
              Palmo started with a simple frustration: coconut water in a carton never tasted like coconut water on the beach. So we went to the beach, and worked backwards.
            </AnimatedParagraph>
          </div>
          <PalmTree interactive className="size-[30vw] opacity-76 -rotate-45 absolute top-[4vw] right-[-4vw] max-md:size-[70vw] max-md:top-[8vh] max-md:right-[-24vw] max-md:opacity-50" />
          <div className="relative mt-[6vw] flex gap-[2vw] max-md:flex-col max-md:items-center">
            {PHOTOS.map((src, i) => (
              <div key={src} className={`h-[34vw] w-[24vw] bg-light-beige p-[1vw] max-md:h-[70vw] max-md:w-[52vw] max-md:p-[2vw] ${i === 0 ? "rotate-[-4deg]" : i === 2 ? "rotate-[5deg]" : "mt-[3vw]"}`}>
                <div className="relative h-full w-full bg-foreground">
                  <Image src={src} alt="" fill sizes="(max-width: 1024px) 52vw, 24vw" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section data-nav-dark="0 7" className="relative z-10 w-full bg-foreground text-background pb-[10vw]">
          <div className="absolute translate-y-[-7.5vw] top-0 left-0 w-full h-fit">
            <Scallops />
          </div>
          <div className="paddx relative z-10 pt-[12vw] max-md:pt-[18vw]">
            <div className="flex items-center gap-[2vw] max-md:flex-col">
              <AnimatedHeading as="h2" className="text150 uppercase">
                How we do it
              </AnimatedHeading>
              <DrawSVG className="w-[20vw] text-beige max-md:hidden" scrub={false} start="top 80%" stagger="sequential">
                <Waves className="w-full" />
              </DrawSVG>
            </div>
            <ol className="mt-[4vw] grid grid-cols-3 gap-[2vw] max-md:grid-cols-1 max-md:gap-[6vw] max-md:mt-[8vw]">
              {BEATS.map((b) => (
                <li key={b.n} className="relative rounded-[1.8vw] border-4 border-light-beige/40 p-[2.5vw] max-md:rounded-3xl max-md:p-6">
                  <span className="absolute left-[1.2vw] top-[1.2vw] size-[1vw] rounded-full bg-light-beige max-md:left-4 max-md:top-4 max-md:size-2.5" />
                  <span className="absolute right-[1.2vw] top-[1.2vw] size-[1vw] rounded-full bg-light-beige max-md:right-4 max-md:top-4 max-md:size-2.5" />
                  <p className="font-patrick-hand text32 text-beige">{b.n}</p>
                  <h3 className="font-khand text52 mt-[.5vw] font-semibold uppercase leading-[95%]">{b.title}</h3>
                  <AnimatedParagraph className="text32 mt-[1vw] text-background/80 max-md:mt-3">{b.copy}</AnimatedParagraph>
                </li>
              ))}
            </ol>
            <div className="mt-[4vw] flex justify-center max-md:mt-[8vw]">
              <TransitionLink href="/flavours">
                <Button title="Explore Flavors" className="text-beige" />
              </TransitionLink>
            </div>
          </div>
          <Parallax speed={-0.08} rotate={20} className="pointer-events-none absolute text-light-beige size-[16vw] bottom-[2vw] right-[4vw] max-md:size-[40vw]">
            <CoconutPiece2 className="size-full" />
          </Parallax>
        </section>

        <Cta paddingTop="pt-[10vw]" />
      </main>
      <Footer />
    </>
  );
}
