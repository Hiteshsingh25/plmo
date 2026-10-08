import Scallops from "@/components/ui/Scallops";
import SlotWords from "@/components/ui/SlotWords";
import Parallax from "@/components/ui/Parallax";
import DrawSVG from "@/components/ui/DrawSVG";
import { ArrowDoodle, CoconutPiece1, CoconutPiece2, Smily } from "@/components/ui/Icons";

/** Dark scalloped band with the slot-word headline and gold doodles. */
export default function Introduction() {
  return (
    <section id="introduction" className="relative overflow-x-hidden w-full z-10 mt-[-10vw]">
      <Scallops />
      <div data-nav-dark="true" className="text-background bg-foreground paddx h-[calc(100vh+10vw)] flex items-center justify-center relative z-10 mt-[-10vw] w-full">
        <Parallax speed={0.12} className="relative z-10">
          <h2 className="text150 text-center w-[85vw] uppercase">
            Pure coconut water. Naturally hydrating, refreshingly{" "}
            <SlotWords
              words={[
                { text: "pure", className: "bg-beige text-foreground" },
                { text: "Fresh", className: "bg-gold text-background" },
                { text: "Clean", className: "bg-light-beige text-light-brown" },
              ]}
            />
            , from nature&apos;s source.
          </h2>
        </Parallax>

        <div className="absolute z-0 pointer-events-none max-md:size-[30vw] size-[10vw] top-[10vw] max-md:top-[40vw] left-[5vw]">
          <Smily className="size-full" />
        </div>
        <div className="absolute z-0 pointer-events-none max-md:size-[35vw] text-light-beige size-[16vw] max-md:bottom-[60vw] max-md:left-[15vw] bottom-[10vw] left-[5vw]">
          <CoconutPiece1 className="size-full" />
        </div>
        <div className="absolute z-0 pointer-events-none max-md:size-[35vw] size-[15vw] top-[9vw] max-md:top-[30vw] right-[4vw] text-light-beige">
          <CoconutPiece2 className="size-full" />
        </div>

        <Parallax speed={0.1} className="absolute max-md:hidden max-md:size-[35vw] bottom-[13.5vw] text-beige right-[16vw]">
          <DrawSVG start="top 90%" end="top 50%">
            <ArrowDoodle className="size-[6vw] scale-x-[-1] -rotate-5" />
          </DrawSVG>
          <p className="text32 w-[9vw] -rotate-10 translate-x-[1.5vw] font-medium mt-[.5vw] text-center capitalize font-patrick-hand">thats why people love to drink it !</p>
        </Parallax>
      </div>
    </section>
  );
}
