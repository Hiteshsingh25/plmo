"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  isLoaderFinished: boolean;
  isTransitionFinished: boolean;
  setIsTransitionFinished: (v: boolean) => void;
};

const AnimationCtx = createContext<Ctx>({
  isLoaderFinished: false,
  isTransitionFinished: true,
  setIsTransitionFinished: () => {},
});

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [isLoaderFinished, setLoaderFinished] = useState(false);
  const [isTransitionFinished, setIsTransitionFinished] = useState(true);

  useEffect(() => {
    if (window.__loaderFinished) {
      setLoaderFinished(true);
      return;
    }
    const done = () => setLoaderFinished(true);
    window.addEventListener("loaderComplete", done);
    return () => window.removeEventListener("loaderComplete", done);
  }, []);

  const value = useMemo(() => ({ isLoaderFinished, isTransitionFinished, setIsTransitionFinished }), [isLoaderFinished, isTransitionFinished]);
  return <AnimationCtx.Provider value={value}>{children}</AnimationCtx.Provider>;
}

export const useAnimation = () => useContext(AnimationCtx);
