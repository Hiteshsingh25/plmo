"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAnimation } from "@/components/providers/AnimationContext";

const NAMES: Record<string, string> = { "/": "Palmo", "/flavours": "Flavours", "/story": "Our Story" };
const MOODS = ["Pouring", "Pressing", "Chilling", "Sipping", "Bliss"];

/** Cycles the tab title "Palmo | Pouring → Pressing → Chilling…" once the site is in. */
export default function TitleTicker() {
  const path = usePathname();
  const { isTransitionFinished, isLoaderFinished } = useAnimation();
  const base = useMemo(
    () =>
      NAMES[path] ??
      (path
        .split("/")
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
        .join(" | ") ||
        "Palmo"),
    [path],
  );

  useEffect(() => {
    if (!isTransitionFinished || !isLoaderFinished) {
      document.title = "Pouring...";
      return;
    }
    const titles = MOODS.map((m) => `${base} | ${m}`);
    let i = 0;
    document.title = titles[i];
    i = (i + 1) % titles.length;
    const id = setInterval(() => {
      document.title = titles[i];
      i = (i + 1) % titles.length;
    }, 800);
    return () => clearInterval(id);
  }, [base, isTransitionFinished, isLoaderFinished]);

  return null;
}
