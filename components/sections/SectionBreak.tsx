import { AnimatedHeading } from "@/components/ui/AnimatedText";

/** Breathing room: the can spins down this runway (see `data-can-spin-runway`) over "KEEP SIPPING..". */
export default function SectionBreak() {
  return (
    <section id="section-break" data-can-spin-runway="true" className="h-screen max-md:overflow-x-clip max-md:h-[50vh] bg-background flex items-center justify-center w-full">
      <AnimatedHeading as="h2" className="text180 pb-[6vw] max-md:pb-0! uppercase">
        KEEP SIPPING..
      </AnimatedHeading>
    </section>
  );
}
