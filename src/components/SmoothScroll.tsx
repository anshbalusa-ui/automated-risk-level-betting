"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    if (reducedMotion.matches || coarsePointer.matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      lerp: 0.1,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
      anchors: { offset: -18 },
      allowNestedScroll: true,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}
