"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Button from "@/components/ui/Button";
import { TransitionLink } from "@/components/providers/PageTransition";
import { onSeq, SEQ } from "@/lib/events";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/* progress-bar stages; `at` is the master-timeline time each label lands */
const STAGES = [
  { at: 0.9, p: 0, label: "Whole coconut" },
  { at: 1.9, p: 0.34, label: "Shaking" },
  { at: 2.8, p: 0.62, label: "Cracked open" },
  { at: 4.2, p: 1, label: "Canned" },
];

/**
 * Copy overlay for the coconut sequence. A paused master timeline holds the
 * COCONUT reveal, both paragraphs, the CTA and the progress readout; the 3D
 * scene advances it through labels via `coconut:*` events and the scroll edges.
 */
export default function SequenceOverlay() {
  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const lead = useRef<HTMLParagraphElement>(null);
  const side = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const stage = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      let teardown: (() => void) | null = null;
      let lastW = window.innerWidth;
      let resizeT: ReturnType<typeof setTimeout> | null = null;

      const build = () => {
        const chars = SplitText.create(title.current!, { type: "chars", charsClass: "inline-block will-change-transform", mask: "chars" });
        const leadLines = SplitText.create(lead.current!, { type: "lines", linesClass: "will-change-transform", mask: "lines" });
        const sideLines = SplitText.create(side.current!, { type: "lines", linesClass: "will-change-transform", mask: "lines" });
        const prog = { p: 0 };
        let stageIdx = -1;
        let stageTl: gsap.core.Timeline | null = null;

        const readout = (time = 0) => {
          const p = prog.p;
          gsap.set(fill.current, { width: `${100 * p}%` });
          counter.current!.textContent = String(Math.round(100 * p)).padStart(3, "0");
          let i = 0;
          while (i + 1 < STAGES.length && time > STAGES[i].at) i++;
          if (i === stageIdx) return;
          const first = stageIdx === -1;
          stageIdx = i;
          if (first) {
            stage.current!.textContent = STAGES[i].label;
            return;
          }
          stageTl?.kill();
          stageTl = gsap
            .timeline()
            .to(stage.current, { autoAlpha: 0, y: -6, duration: 0.15, ease: "power2.in" })
            .add(() => (stage.current!.textContent = STAGES[stageIdx].label))
            .fromTo(stage.current, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" });
        };

        gsap.set([...chars.chars, ...leadLines.lines, ...sideLines.lines], { yPercent: 115 });
        gsap.set(cta.current, { autoAlpha: 0, y: 12 });
        gsap.set(meter.current, { autoAlpha: 0, y: 10 });
        gsap.set(track.current, { scaleX: 0 });
        readout();

        const master = gsap.timeline({ paused: true, onUpdate: () => readout(master.time()) });
        STAGES.slice(1).forEach((s, i) => {
          const prev = STAGES[i];
          master.to(prog, { p: s.p, duration: s.at - prev.at, ease: "power1.inOut" }, prev.at);
        });
        master
          .to(meter.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0)
          .to(track.current, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 0)
          .addLabel("ready", 0.9)
          .addLabel("shaking", 1.9);
        master.to(chars.chars, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: { each: 0.035, from: "center" } }, 1.9).addLabel("burst", 2.8);
        master
          .to(leadLines.lines, { yPercent: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 2.8 - 0.2)
          .to(sideLines.lines, { yPercent: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 2.8 + 0.05)
          .to(cta.current, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 3.15)
          .addLabel("done", 4.2);
        // speed ramps so the readout keeps pace with the burst
        master
          .to(master, { timeScale: 1.5, duration: 0.8, ease: "power2.out" }, 0.9)
          .to(master, { timeScale: 3, duration: 0.3, ease: "power2.out" }, 1.9)
          .to(master, { timeScale: 1, duration: 2.6, ease: "power1.inOut" }, 1.9 + 0.3);

        let seek: gsap.core.Tween | null = null;
        const tweenTo = (label: string | number, vars: gsap.TweenVars) => {
          seek?.kill();
          seek = master.tweenTo(label, { ease: "none", ...vars });
        };
        const goTo = (label: string, budget?: number) => {
          const dist = master.labels[label] - master.time();
          if (dist <= 0) return;
          tweenTo(label, { duration: Math.min(dist, budget && budget > 0 ? Math.max(budget - 0.15, 0.1) : Infinity) });
        };

        const offs = [
          onSeq(SEQ.shake, () => goTo("shaking")),
          onSeq(SEQ.burst, (e) => goTo("burst", e.detail?.budget)),
          onSeq(SEQ.can, (e) => goTo("done", e.detail?.budget)),
          onSeq(SEQ.reset, () => {
            const t = master.time();
            if (t > 0) tweenTo(0, { duration: t / 1.2, ease: "none" });
          }),
        ];
        const enterST = ScrollTrigger.create({ trigger: root.current, start: "top top", onEnter: () => goTo("ready") });
        const doneST = ScrollTrigger.create({
          trigger: root.current,
          start: "bottom bottom",
          onEnter: () => goTo("done"),
          onRefresh: (st) => st.progress === 1 && goTo("done"),
        });

        return () => {
          offs.forEach((off) => off());
          enterST.kill();
          doneST.kill();
          seek?.kill();
          stageTl?.kill();
          master.kill();
          gsap.killTweensOf(master);
          chars.revert();
          leadLines.revert();
          sideLines.revert();
        };
      };

      teardown = build();
      const onResize = () => {
        const w = window.innerWidth;
        if (w === lastW) return;
        lastW = w;
        if (resizeT) clearTimeout(resizeT);
        resizeT = setTimeout(() => {
          teardown?.();
          teardown = build();
          ScrollTrigger.refresh();
        }, 150);
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      return () => {
        if (resizeT) clearTimeout(resizeT);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
        teardown?.();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="sequence-animation" className="h-[calc(100vh+20vw)] max-md:h-[calc(100dvh+20vw)] bg-background mt-[-20vw] w-full relative">
      <div className="sticky top-0 h-screen max-md:h-[100dvh] w-full overflow-hidden">
        <div ref={inner} className="relative z-10 h-full paddx max-md:flex max-md:flex-col max-md:items-center max-md:pt-[95px] max-md:pb-[85px] max-md:justify-between max-md:text-center">
          <div className="absolute top-[7vw] left-[3vw] max-md:static max-md:flex max-md:w-full max-md:flex-col max-md:items-center">
            <h2 ref={title} className="text180 uppercase whitespace-nowrap max-md:text-[11vw] max-md:leading-none max-md:tracking-tight max-md:text-center">
              Coconut
            </h2>
            <p ref={lead} className="mt-[2vw] w-[27vw] text36 font-medium max-md:mt-1.5 max-md:w-full max-md:max-w-[78vw] max-md:text-center max-md:text-[3.3vw] max-md:leading-snug max-md:opacity-85">
              One green coconut, opened and pressed within a day of harvest. 100% raw, with 500mg of potassium.
            </p>
          </div>
          <div className="hidden max-md:block max-md:flex-1 max-md:min-h-[25dvh]" />
          <div ref={meter} className="absolute bottom-[3vw] left-[3vw] w-[24vw] pointer-events-none max-md:static max-md:w-full max-md:px-1">
            <div className="flex items-end justify-between mb-[.6vw] font-khand font-bold uppercase leading-none max-md:mb-1.5">
              <span ref={stage} className="text36 max-md:text-[4.5vw]">
                Whole coconut
              </span>
              <span ref={counter} className="tabular-nums text36 max-md:text-[4.5vw]">
                000
              </span>
            </div>
            <div ref={track} className="h-[.55vw] min-h-1.5 w-full rounded-full bg-foreground/12 origin-left relative overflow-hidden max-md:h-2.5">
              <span ref={fill} className="absolute inset-y-0 left-0 w-0 rounded-full bg-foreground" />
            </div>
          </div>
          <div className="absolute bottom-[3vw] right-[3vw] w-[24vw] text-right max-md:hidden">
            <p ref={side} className="text36 font-medium">
              Six flavours, each one pressed with real fruit. Mango, lychee, guava and three more worth meeting.
            </p>
            <TransitionLink ref={cta} href="/flavours" aria-label="Explore all flavours" className="mt-[.8vw] inline-block">
              <Button title="Explore Flavors" />
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
