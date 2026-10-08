import type { Metadata } from "next";
import { FLAVOURS } from "@/lib/flavours";
import FlavourCard from "@/components/sections/FlavourCard";
import Scallops from "@/components/ui/Scallops";
import Parallax from "@/components/ui/Parallax";
import { AnimatedHeading, AnimatedParagraph } from "@/components/ui/AnimatedText";
import { CoconutPiece1, CoconutPiece3 } from "@/components/ui/Icons";
import Cta from "@/components/sections/Cta";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = { title: "Palmo | Flavours" };

export default function FlavoursPage() {
  return (
    <>
      <main id="main-content" className="flex-1 overflow-x-clip w-full relative">
        <section className="paddx bg-background relative w-full pt-[12vw] pb-[6vw] max-md:pt-[26vw]">
          <AnimatedHeading as="h1" className="text180 uppercase max-md:text-center">
            Six ways <br /> to sip.
          </AnimatedHeading>
          <AnimatedParagraph delay={0.2} className="text36 mt-[2vw] w-[32vw] font-medium max-md:w-full max-md:text-center max-md:mt-6">
            Every can starts as one green coconut, opened and pressed within a day of harvest. Five of them meet real fruit on the way to the tin.
          </AnimatedParagraph>
          <Parallax speed={-0.06} rotate={15} className="pointer-events-none absolute right-[4vw] top-[8vw] size-[16vw] text-light-beige max-md:hidden">
            <CoconutPiece1 className="size-full" opacity=".8" />
          </Parallax>
        </section>

        <section data-nav-dark="0 7" className="relative z-10 w-full bg-foreground text-background pb-[9vw]">
          <div className="absolute translate-y-[-7.5vw] top-0 left-0 w-full h-fit">
            <Scallops />
          </div>
          <div className="paddx relative z-10 grid grid-cols-3 gap-[1vw] pt-[10vw] max-md:grid-cols-1 max-md:gap-[4vw] max-md:pt-[14vw]">
            {FLAVOURS.map((f, i) => (
              <FlavourCard key={f.id} flavour={f} index={i} isDarkSection />
            ))}
          </div>
          <Parallax speed={-0.08} rotate={20} className="pointer-events-none absolute text-light-beige size-[16vw] bottom-[2vw] right-[4vw] max-md:size-[40vw]">
            <CoconutPiece3 className="size-full" />
          </Parallax>
        </section>

        <Cta paddingTop="pt-[10vw]" />
      </main>
      <Footer />
    </>
  );
}
