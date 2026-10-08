"use client";

import { useRef, type HTMLAttributes } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useMouse } from "@/lib/hooks";
import { prefersReducedMotion } from "@/lib/events";

gsap.registerPlugin(useGSAP);

type Props = HTMLAttributes<HTMLDivElement> & {
  showTrunk?: boolean;
  /** lean toward the pointer / device tilt */
  interactive?: boolean;
  intensity?: number;
  fill?: string;
};

const LEAVES = [
  "M276.9 249.322L245.035 358.522L218.104 349.667L239.372 377.927L200.966 509.509C167.804 469.088 154.52 411.898 170.563 356.94C186.604 301.952 228.007 262.772 276.9 249.322Z",
  "M103.415 207.766C157.405 181.329 218.871 187.303 273.502 218.22L111.253 297.676L93.7865 257.119L90.1138 308.033L2.44079e-05 352.169C13.6111 287.814 49.4243 234.204 103.415 207.766Z",
  "M208.565 116.324L163.197 142.072L124.48 120.504L144.267 80.4888L98.9187 106.247L18.5067 61.4334C67.6015 24.6383 133.909 17.6759 190.768 49.3588C247.628 81.052 279.895 142.964 279.238 206.757L188.778 156.327L208.565 116.324Z",
  "M396.393 62.3739L422.723 91.8752L302.498 212.828C288.192 156.793 303.813 92.8834 347.994 48.4469C392.172 4.00119 453.144 -9.11952 505.07 9.05494L442.601 71.8976L396.393 62.3739Z",
  "M453.656 172.446C505.236 188.06 541.998 231.991 553.217 283.818L494.986 266.187L485.685 236.307L478.98 261.357L426.871 245.588L416.035 210.724L408.197 239.944L313.736 211.373C349.017 173.619 402.059 156.851 453.656 172.446Z",
];
const TRUNK =
  "M291.272 233.752L312.996 223.029C391.719 410.788 337.783 853.463 337.783 853.463L267.028 820.022C325.93 605.308 299.765 276.926 291.272 233.752Z";

/** Beige palm silhouette; crown sways forever, leans toward the pointer when `interactive`. */
export default function PalmTree({ className = "", showTrunk = true, interactive = false, intensity = 1, fill = "#FFE386", ...rest }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const lean = useRef<((x: number, y: number) => void) | null>(null);

  useMouse({ enabled: interactive, onChange: (x, y) => lean.current?.(x, y) });

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const leaves = gsap.utils.toArray<SVGPathElement>("[data-leaf]", root.current);
      gsap.to("[data-crown]", {
        rotation: 6,
        transformOrigin: "50% 50%",
        svgOrigin: "300 560",
        duration: 3.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      leaves.forEach((leaf, i) => {
        gsap.to(leaf, {
          rotation: (i % 2 === 0 ? 1 : -1) * gsap.utils.random(2.5, 4.5),
          svgOrigin: "277 233",
          duration: gsap.utils.random(2.6, 3.8),
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.15 * i,
        });
      });
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!interactive || prefersReducedMotion()) return;
      gsap.set("[data-lean]", { svgOrigin: "300 560" });
      const rot = gsap.quickTo("[data-lean]", "rotation", { duration: 0.9, ease: "power3.out" });
      const tx = gsap.quickTo("[data-lean]", "x", { duration: 1.1, ease: "power3.out" });
      const ty = gsap.quickTo("[data-lean]", "y", { duration: 1.1, ease: "power3.out" });
      const leaves = gsap.utils.toArray<SVGPathElement>("[data-leaf]", root.current);
      const scales = leaves.map((l) => gsap.quickTo(l, "scale", { duration: 0.8, ease: "power2.out" }));
      lean.current = (x, y) => {
        rot(5 * x * intensity);
        tx(14 * x * intensity);
        ty(8 * y * intensity);
        scales.forEach((s, i) => s(1 + x * (i % 2 === 0 ? 1 : -1) * 0.03 * intensity));
      };
      return () => {
        lean.current = null;
        gsap.to("[data-lean]", { rotation: 0, x: 0, y: 0, duration: 0.6, ease: "power2.out", overwrite: true });
        gsap.to(leaves, { scale: 1, duration: 0.6, ease: "power2.out", overwrite: true });
      };
    },
    { scope: root, dependencies: [interactive, intensity] },
  );

  return (
    <div ref={root} className={className} {...rest}>
      <svg viewBox={showTrunk ? "0 0 554 588" : "0 0 554 420"} fill="none" xmlns="http://www.w3.org/2000/svg" className="block h-full w-full overflow-visible">
        <g data-lean="true">
          <g data-crown="true">
            {LEAVES.map((d) => (
              <path key={d.slice(0, 12)} data-leaf="true" d={d} fill={fill} />
            ))}
            {showTrunk && <path d={TRUNK} fill={fill} />}
          </g>
        </g>
      </svg>
    </div>
  );
}
