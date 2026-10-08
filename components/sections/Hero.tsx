import { AnimatedHeading, AnimatedParagraph } from "@/components/ui/AnimatedText";
import Button from "@/components/ui/Button";
import DrawSVG from "@/components/ui/DrawSVG";
import { ArrowDoodle } from "@/components/ui/Icons";
import PalmTree from "@/components/ui/PalmTree";
import { TransitionLink } from "@/components/providers/PageTransition";

/** First screen: headline, arrow → benefit list, leaning palm, CTA. The 3D coconut sits behind on the shared canvas. */
export default function Hero() {
  return (
    <section
      id="Hero"
      className="h-screen paddx bg-background w-full overflow-x-hidden py-[6vw] relative max-md:flex max-md:flex-col max-md:items-center max-md:justify-between max-md:text-center max-md:py-[12vh]"
    >
      <div className="contents max-md:z-10 max-md:relative max-md:block max-md:w-full">
        <AnimatedHeading as="h1" className="text-foreground text180 w-[50vw] mt-[2vw] uppercase max-md:w-full max-md:mt-0 max-md:text-center">
          Paradise in <br /> every sip.
        </AnimatedHeading>
        <div className="absolute top-[34vw] left-[32vw] max-md:static max-md:top-auto max-md:left-auto max-md:mt-6 max-md:w-full max-md:flex max-md:justify-center">
          <DrawSVG trigger="loader" delay={0.9} duration={0.8}>
            <ArrowDoodle className="size-[8vw] -rotate-5 max-md:hidden" />
          </DrawSVG>
          <AnimatedParagraph
            as="ul"
            delay={0.35}
            className="text32 leading-relaxed! capitalize text-black list-disc font-patrick-hand mt-[1vw] translate-x-[-2vw] max-md:mt-0 max-md:translate-x-0 max-md:flex max-md:list-none max-md:flex-wrap max-md:justify-center max-md:gap-x-6 max-md:pl-0 max-md:text-center max-md:[&>li]:flex max-md:[&>li]:items-center max-md:[&>li]:gap-2 max-md:[&>li]:before:size-1.5 max-md:[&>li]:before:shrink-0 max-md:[&>li]:before:rounded-full max-md:[&>li]:before:bg-current max-md:[&>li]:before:content-['']"
          >
            <li>Rich in electrolytes</li>
            <li className="-mt-[.5vw]">No added sugar</li>
          </AnimatedParagraph>
        </div>
      </div>

      <PalmTree interactive className="size-[30vw] opacity-76 -rotate-45 absolute top-[4vw] right-[-4vw] max-md:size-[70vw] max-md:top-[8vh] max-md:right-[-24vw] max-md:opacity-50" />

      <div className="absolute bottom-[6vw] space-y-[1vw] right-[3vw] max-md:static max-md:bottom-auto max-md:right-auto max-md:flex max-md:w-full max-md:flex-col max-md:items-center max-md:space-y-5">
        <AnimatedParagraph delay={0.5} className="text32 w-[25vw] font-medium max-md:w-full max-md:text-center">
          Quench Your Thirst With Pure Coconut Bliss, Packed With Natural Electrolytes And Zero Added Sugar, For A Cool Sip Every Time.
        </AnimatedParagraph>
        <TransitionLink href="/flavours">
          <Button title="Discover Flavors" entry entryDelay={1.1} />
        </TransitionLink>
      </div>
    </section>
  );
}
