"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export interface DyeWhorlProps {
  /** Overall animation rate. */
  speed?: number;
  /** Ambient signal density, intentionally kept low for shared backgrounds. */
  density?: number;
  /** Pointer influence, intentionally kept low for shared backgrounds. */
  stir?: number;
  /** Freeze the field on its current frame. */
  paused?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

type RGB = [number, number, number];

const FALLBACK_SIGNAL: RGB = [166, 221, 236];
const SOURCES = [
  { x: 0.14, y: 0.22, phase: 0.4, speed: 0.09, radius: 0.18 },
  { x: 0.84, y: 0.2, phase: 2.1, speed: -0.07, radius: 0.16 },
  { x: 0.28, y: 0.78, phase: 3.6, speed: 0.06, radius: 0.2 },
  { x: 0.8, y: 0.74, phase: 5.2, speed: -0.05, radius: 0.17 },
  { x: 0.52, y: 0.46, phase: 1.4, speed: 0.04, radius: 0.13 },
];

function parseSignal(raw: string): RGB {
  const value = raw.trim();
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (!match) return FALLBACK_SIGNAL;
  const hex = match[1].length === 3
    ? match[1].split("").map((part) => part + part).join("")
    : match[1];
  const number = Number.parseInt(hex, 16);
  return [number >> 16 & 255, number >> 8 & 255, number & 255];
}

function rgba([red, green, blue]: RGB, alpha: number) {
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * A low-gain ambient version of the supplied DyeWhorl interaction.
 *
 * It uses a small 2D canvas rather than a full-screen simulation so the effect
 * can safely sit behind every route. The motion remains real and pointer-aware,
 * but the density, output alpha, and pointer force are deliberately restrained.
 */
export function DyeWhorl({
  speed = 0.35,
  density = 0.42,
  stir = 0.08,
  paused = false,
  children,
  className = "",
  style,
}: DyeWhorlProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedRef = useRef(speed);
  const densityRef = useRef(density);
  const stirRef = useRef(stir);
  const pausedRef = useRef(paused);


  useEffect(() => {
    speedRef.current = speed;
    densityRef.current = density;
    stirRef.current = stir;
    pausedRef.current = paused;
  }, [speed, density, stir, paused]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!wrap || !canvas || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rootStyles = getComputedStyle(document.documentElement);
    const signal = parseSignal(rootStyles.getPropertyValue("--accent"));
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let renderedTime = 0;
    let pointerActive = false;
    let targetPointerX = 0.5;
    let targetPointerY = 0.5;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let visible = document.visibilityState === "visible";

    const resize = () => {
      const bounds = wrap.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const readPointer = (event: PointerEvent) => {
      if (width < 1 || height < 1) return;
      const bounds = wrap.getBoundingClientRect();
      targetPointerX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      targetPointerY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      pointerActive = true;
    };

    const clearPointer = () => {
      pointerActive = false;
    };

    const draw = (now: number, interactive: boolean) => {
      if (width < 1 || height < 1) return;
      const elapsed = now / 1000 * speedRef.current;
      const amount = Math.max(0, Math.min(1, densityRef.current));
      const influence = Math.max(0, Math.min(1, stirRef.current));
      if (interactive) {
        const pointerEase = 1 - Math.exp(-1 / 0.18);
        pointerX += (targetPointerX - pointerX) * pointerEase;
        pointerY += (targetPointerY - pointerY) * pointerEase;
      }

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "screen";

      for (const source of SOURCES) {
        const orbit = elapsed * source.speed + source.phase;
        const x = (source.x + Math.cos(orbit) * 0.055 + Math.sin(orbit * 0.6) * 0.018) * width;
        const y = (source.y + Math.sin(orbit * 0.86) * 0.07 + Math.cos(orbit * 0.43) * 0.02) * height;
        const radius = Math.max(30, Math.min(width, height) * source.radius);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, rgba(signal, 0.12 * amount));
        gradient.addColorStop(0.42, rgba(signal, 0.035 * amount));
        gradient.addColorStop(1, rgba(signal, 0));
        context.fillStyle = gradient;
        context.beginPath();
        context.ellipse(x, y, radius, radius * 0.58, orbit * 0.3, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = rgba(signal, 0.045 * amount);
        context.lineWidth = 0.7;
        context.beginPath();
        context.ellipse(x, y, radius * 0.82, radius * 0.3, orbit * 0.3, 0, Math.PI * 2);
        context.stroke();
      }

      if (interactive && pointerActive) {
        const pointerRadius = Math.max(34, Math.min(width, height) * 0.16);
        const pointerOffset = influence * 16;
        const x = pointerX * width + (pointerX - 0.5) * pointerOffset;
        const y = pointerY * height + (pointerY - 0.5) * pointerOffset;
        const gradient = context.createRadialGradient(x, y, 0, x, y, pointerRadius);
        gradient.addColorStop(0, rgba(signal, 0.07 * amount * influence));
        gradient.addColorStop(0.5, rgba(signal, 0.018 * amount * influence));
        gradient.addColorStop(1, rgba(signal, 0));
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, pointerRadius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalCompositeOperation = "source-over";
    };

    const loop = (now: number) => {
      if (visible && !pausedRef.current && !motionPreference.matches) {
        renderedTime = now;
        draw(now, true);
      } else if (visible) {
        draw(renderedTime, false);
      }
      frame = window.requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();
    draw(renderedTime, false);
    frame = window.requestAnimationFrame(loop);
    window.addEventListener("pointermove", readPointer, { passive: true });
    window.addEventListener("pointerleave", clearPointer, { passive: true });
    window.addEventListener("blur", clearPointer, { passive: true });
    const onVisibilityChange = () => {
      visible = document.visibilityState === "visible";
      renderedTime = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", readPointer);
      window.removeEventListener("pointerleave", clearPointer);
      window.removeEventListener("blur", clearPointer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      data-dye-whorl
      aria-hidden={children ? undefined : true}
      className={`relative isolate h-full w-full touch-none overflow-hidden bg-transparent ${className}`}
      style={style}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block" />
      {children ? <div className="relative z-[1] h-full w-full">{children}</div> : null}
    </div>
  );
}

DyeWhorl.displayName = "DyeWhorl";

export default DyeWhorl;
