"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    if (reducedMotion.matches || !finePointer.matches) return;

    let currentY = window.scrollY;
    let targetY = currentY;
    let frame = 0;
    let edgeFrame = 0;
    let edgeOffset = 0;
    let edgeTarget = 0;
    let edgeReleaseTimer = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const normalizeWheel = (event: WheelEvent) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    const hasScrollableParent = (target: EventTarget | null, delta: number) => {
      let node = target instanceof HTMLElement ? target : null;

      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        const canScroll = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;

        if (canScroll) {
          const canMoveDown = delta > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1;
          const canMoveUp = delta < 0 && node.scrollTop > 1;
          if (canMoveDown || canMoveUp) return true;
        }

        node = node.parentElement;
      }

      return false;
    };

    const animate = () => {
      frame = 0;

      const distance = targetY - currentY;
      currentY += distance * 0.2;

      if (Math.abs(distance) < 0.35) {
        currentY = targetY;
      }

      window.scrollTo(0, currentY);

      if (currentY !== targetY) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const startFrame = () => {
      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    const animateEdge = () => {
      edgeFrame = 0;
      edgeOffset += (edgeTarget - edgeOffset) * 0.24;

      if (Math.abs(edgeTarget - edgeOffset) < 0.05) {
        edgeOffset = edgeTarget;
      }

      if (Math.abs(edgeOffset) < 0.05 && edgeTarget === 0) {
        edgeOffset = 0;
        document.documentElement.style.removeProperty("--edge-shift");
        return;
      }

      document.documentElement.style.setProperty("--edge-shift", `${edgeOffset.toFixed(2)}px`);
      edgeFrame = window.requestAnimationFrame(animateEdge);
    };

    const kickEdge = (direction: -1 | 1, delta: number) => {
      const amount = clamp(Math.abs(delta) * 0.028, 1.5, 5);
      edgeTarget = direction * clamp(Math.abs(edgeTarget) + amount, 0, 8);

      if (edgeReleaseTimer) window.clearTimeout(edgeReleaseTimer);
      edgeReleaseTimer = window.setTimeout(() => {
        edgeTarget = 0;
        if (!edgeFrame) edgeFrame = window.requestAnimationFrame(animateEdge);
      }, 70);

      if (!edgeFrame) edgeFrame = window.requestAnimationFrame(animateEdge);
    };

    const onWheel = (event: WheelEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        hasScrollableParent(event.target, event.deltaY)
      ) {
        return;
      }

      const delta = clamp(normalizeWheel(event), -150, 150);
      if (Math.abs(delta) < 0.01) return;

      event.preventDefault();

      const actualY = window.scrollY;
      if (Math.abs(actualY - currentY) > 80) {
        currentY = actualY;
        targetY = actualY;
      }

      const limit = maxScroll();
      const atTop = currentY <= 1.5 && targetY <= 1.5 && delta < 0;
      const atBottom = currentY >= limit - 1.5 && targetY >= limit - 1.5 && delta > 0;

      if (atTop) {
        kickEdge(1, delta);
      } else if (atBottom) {
        kickEdge(-1, delta);
      }

      targetY = clamp(targetY + delta * 0.74, 0, limit);
      startFrame();
    };

    const onExternalScroll = () => {
      if (frame) return;
      currentY = window.scrollY;
      targetY = currentY;
    };

    const onResize = () => {
      targetY = clamp(targetY, 0, maxScroll());
      currentY = clamp(currentY, 0, maxScroll());
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onExternalScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (edgeFrame) window.cancelAnimationFrame(edgeFrame);
      if (edgeReleaseTimer) window.clearTimeout(edgeReleaseTimer);
      document.documentElement.style.removeProperty("--edge-shift");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onExternalScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
