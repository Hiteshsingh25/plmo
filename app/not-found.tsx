"use client";

import { useState } from "react";
import FruitSlicer, { type Score } from "@/components/game/FruitSlicer";
import SlashBanner from "@/components/game/SlashBanner";
import PalmTree from "@/components/ui/PalmTree";
import { TransitionLink } from "@/components/providers/PageTransition";

/** Lost in the grove — the 404 is a playable slicing field. */
export default function NotFound() {
  const [score, setScore] = useState<Score>({ score: 0, bombsHit: 0 });
  return (
    <main id="main-content" data-slash-zone className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-background text-foreground paddx py-[3vw] max-md:py-[6vw] select-none">
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <FruitSlicer onScoreChange={setScore} />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between opacity-10 overflow-hidden z-0" aria-hidden="true">
        <PalmTree interactive fill="currentColor" className="size-[30vw] max-md:size-[55vw] -translate-x-[6vw] rotate-15 text-foreground" />
        <PalmTree interactive fill="currentColor" className="size-[32vw] max-md:size-[60vw] translate-x-[6vw] -rotate-15 -scale-x-100 text-foreground" />
      </div>
      <header className="relative z-20 flex w-full items-center justify-center pointer-events-none pt-2 max-md:pt-1">
        <div className="flex items-center gap-3.5 rounded-full border border-foreground/20 bg-foreground/90 text-light-beige backdrop-blur-md px-5 py-2 max-md:px-4 max-md:py-1.5 shadow-sm">
          <div className="flex items-baseline gap-2 font-khand leading-none">
            <span className="text-xs font-semibold uppercase tracking-widest text-beige/70">Score</span>
            <span className="text-3xl max-md:text-2xl font-bold tracking-tight text-beige tabular-nums">{score.score}</span>
          </div>
          <span className="h-4 w-px bg-light-beige/25" aria-hidden="true" />
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`size-2 rounded-full transition-all duration-300 ${i < score.bombsHit ? "bg-[#FF4D4F] scale-125" : "bg-light-beige/25"}`} />
            ))}
          </div>
        </div>
      </header>
      <div className="absolute inset-0 z-2 flex flex-col items-center justify-center text-center max-w-xl mx-auto pointer-events-none px-4">
        <h1 className="font-khand text-[16vw] max-md:text-[32vw] font-bold leading-none tracking-[-0.04em] uppercase text-foreground">404</h1>
        <p className="font-patrick-hand text-2xl max-md:text-lg text-foreground/75 mt-1">Lost in the grove. Slice coconuts or head back.</p>
        <div className="mt-6 flex items-center justify-center gap-3 pointer-events-auto">
          <TransitionLink href="/" className="rounded-full bg-foreground px-6 py-2.5 font-patrick-hand text-xl max-md:text-lg text-light-beige transition-all duration-300 hover:bg-gold hover:text-foreground active:scale-95">
            Home
          </TransitionLink>
          <TransitionLink href="/flavours" className="rounded-full border border-foreground/30 bg-background/80 backdrop-blur-sm px-6 py-2.5 font-patrick-hand text-xl max-md:text-lg text-foreground transition-all duration-300 hover:border-foreground hover:bg-beige active:scale-95">
            Flavours
          </TransitionLink>
        </div>
      </div>
      <footer className="relative z-20 pointer-events-none text-center pb-2">
        <p className="font-sans text-[11px] font-medium text-foreground/45 uppercase tracking-widest">Swipe / drag to slice</p>
      </footer>
      <SlashBanner />
    </main>
  );
}
