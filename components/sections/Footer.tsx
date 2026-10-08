"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { AnimatedParagraph } from "@/components/ui/AnimatedText";
import PalmTree from "@/components/ui/PalmTree";
import { TransitionLink } from "@/components/providers/PageTransition";
import FruitSlicer, { type Score } from "@/components/game/FruitSlicer";
import SlashBanner from "@/components/game/SlashBanner";
import { NAV } from "@/components/chrome/Header";

const LINKS = [{ label: "Home", href: "/" }, { label: "Our Story", href: "/story" }, ...NAV.slice(2)];

/**
 * Fixed dark footer revealed as the page scrolls off it; the whole thing is
 * the fruit-slicing playfield. "Freeze" locks scroll so touch can slice.
 */
export default function Footer() {
  const lenis = useLenis();
  const [score, setScore] = useState<Score>({ score: 0, bombsHit: 0 });
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    if (frozen) {
      lenis?.stop();
      document.body.style.touchAction = "none";
    } else {
      lenis?.start();
      document.body.style.touchAction = "";
    }
    return () => {
      lenis?.start();
      document.body.style.touchAction = "";
    };
  }, [frozen, lenis]);

  return (
    <div id="footer" data-slash-zone className="relative z-0 h-screen max-md:h-dvh min-h-160 max-md:min-h-145 w-full select-none">
      <div className="fixed bottom-0 left-0 h-screen max-md:h-dvh min-h-160 max-md:min-h-145 w-full bg-foreground text-background">
        <footer className="relative flex h-full w-full flex-col justify-between max-md:justify-end overflow-hidden pt-[9.5vw] max-md:pt-[22vw] pb-[1.5vw] max-md:pb-[5vw] border-t border-background/10">
          <div className="absolute inset-0 z-15 pointer-events-auto">
            <FruitSlicer onScoreChange={setScore} />
          </div>

          <div className="paddx relative z-20 flex max-md:flex-col items-start justify-between gap-[4vw] max-md:gap-[7vw] pointer-events-none">
            <div className="w-[24vw] max-md:w-full max-md:text-center">
              <AnimatedParagraph className="font-patrick-hand text32 max-md:text-lg uppercase text-beige tracking-wider">palmo coconut co.</AnimatedParagraph>
              <AnimatedParagraph className="text36 max-md:w-[65%] max-md:mx-auto max-md:text-[1.35rem] mt-[1vw] max-md:mt-3 font-medium capitalize text-background/90 leading-tight max-md:leading-snug">
                Cold pressed, never concentrated. Picked ripe, sipped cold.
              </AnimatedParagraph>
            </div>
            <nav aria-label="Footer" className="flex max-md:mb-[10vw] gap-[5vw] max-md:w-full font-patrick-hand text32 max-md:text-lg! pt-[4vw] max-md:pt-0 capitalize">
              <ul className="flex max-md:w-full max-md:flex-col max-md:justify-center gap-[2vw] max-md:gap-y-1">
                {LINKS.map((l) => (
                  <li key={l.href} className="max-md:text-center">
                    <TransitionLink href={l.href} className="inline-block max-md:py-1 text-background transition-colors hover:text-beige pointer-events-auto">
                      {l.label}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="relative mt-[2vw] max-md:mt-[4vw] h-[28vw] max-md:h-[52vw] pointer-events-none">
            <div className="pointer-events-none z-10 absolute inset-x-0 bottom-0 h-full">
              <PalmTree interactive aria-hidden="true" className="absolute top-[5vw] max-md:top-[-48vw] left-[-3vw] max-md:left-[-16vw] rotate-30 max-md:rotate-35 h-[22vw] w-[22vw] max-md:h-[46vw] max-md:w-[46vw] -scale-x-100 opacity-80" />
              <PalmTree interactive aria-hidden="true" className="absolute top-[1vw] max-md:top-[-52vw] right-[-2vw] max-md:right-[-14vw] -rotate-35 max-md:-rotate-35 h-[24vw] w-[24vw] max-md:h-[48vw] max-md:w-[48vw] opacity-80" />
            </div>
            <div className="absolute inset-x-0 bottom-[1vw] max-md:bottom-0 z-5">
              <h2 className="text-center font-khand text-[22vw] max-md:text-[30vw] leading-[.78] font-medium tracking-[-.04em] uppercase text-beige">Palmo</h2>
            </div>
          </div>

          {/* score pill */}
          <div className="z-30 flex items-center gap-[0.8vw] max-md:gap-2 rounded-full border border-background/15 bg-foreground/90 backdrop-blur-md px-[1.2vw] py-[0.5vw] max-md:px-3 max-md:py-1.5 select-none md:absolute md:bottom-[2vw] md:right-[3vw] max-md:relative max-md:mx-auto max-md:mb-3 max-md:w-fit pointer-events-auto">
            <div className="flex items-baseline gap-[0.4vw] max-md:gap-1.5 font-khand leading-none pointer-events-none">
              <span className="text-[1.1vw] max-md:text-xs font-medium uppercase tracking-wider text-beige/70">Score</span>
              <span className="text-[1.8vw] max-md:text-xl font-bold tracking-tight text-beige tabular-nums">{score.score}</span>
            </div>
            <span className="h-[1.2vw] max-md:h-3.5 w-px bg-background/20" aria-hidden="true" />
            <div className="flex items-center gap-[0.35vw] max-md:gap-1 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`size-[0.45vw] max-md:size-1.5 rounded-full transition-all duration-300 ${i < score.bombsHit ? "bg-[#FF4D4F] scale-125" : "bg-background/25"}`} />
              ))}
            </div>
            <div className="hidden max-lg:flex items-center">
              <span className="h-3.5 w-px bg-background/20 mr-2" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setFrozen((f) => !f)}
                className={`flex w-[68px] items-center justify-center gap-1.5 rounded-full px-2 py-0.5 font-khand text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${frozen ? "bg-beige text-foreground" : "bg-background/15 text-background/80 hover:bg-background/25"}`}
                aria-pressed={frozen}
                aria-label={frozen ? "Unfreeze Scroll" : "Freeze Scroll"}
              >
                <span className={`size-1.5 shrink-0 rounded-full ${frozen ? "bg-[#52C41A]" : "bg-background/40"}`} />
                <span className="w-[38px] text-left">{frozen ? "Freezed" : "Freeze"}</span>
              </button>
            </div>
          </div>

          <div className="relative w-[50vw] max-md:w-[90vw] mx-auto rounded-full max-md:rounded-2xl z-20 flex max-md:flex-col items-center justify-between max-md:justify-center max-md:gap-1 bg-light-beige text-foreground px-[1.5vw] max-md:px-4 py-[1vw] max-md:py-3 text-[1vw] max-md:text-[0.8rem] text-center capitalize pointer-events-auto">
            <p>© {new Date().getFullYear()} palmo. all rights reserved.</p>
            <p>made under the sun</p>
          </div>
          <SlashBanner />
        </footer>
      </div>
    </div>
  );
}
