"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  phase: number;
  drift: number;
  accent: boolean;
};

type ParticleTextCanvasProps = {
  text: string;
};

function fract(value: number) {
  return value - Math.floor(value);
}

function seededValue(x: number, y: number, salt: number) {
  return fract(Math.sin(x * 12.9898 + y * 78.233 + salt * 37.719) * 43758.5453);
}

export default function ParticleTextCanvas({ text }: ParticleTextCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let resizeFrame = 0;
    let disposed = false;
    let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        const shimmer = reducedMotion ? 0.86 : 0.68 + Math.sin(time * 0.0012 + particle.phase) * 0.2;
        const x = particle.x + (reducedMotion ? 0 : Math.sin(time * 0.00055 + particle.phase) * particle.drift);
        const y = particle.y + (reducedMotion ? 0 : Math.cos(time * 0.0007 + particle.phase) * particle.drift * 0.55);
        const radius = particle.radius * (reducedMotion ? 1 : 0.9 + Math.sin(time * 0.001 + particle.phase) * 0.12);

        context.globalAlpha = Math.max(0.18, shimmer);
        context.fillStyle = particle.accent ? "#a9dcd4" : "#eef7f3";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
    };

    const animate = (time: number) => {
      animationFrame = 0;
      if (disposed) return;
      draw(time);
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (!reducedMotion && !animationFrame) animationFrame = window.requestAnimationFrame(animate);
    };

    const build = () => {
      if (disposed) return;

      const bounds = host.getBoundingClientRect();
      width = Math.max(1, Math.ceil(bounds.width));
      height = Math.max(1, Math.ceil(bounds.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;

      const style = getComputedStyle(host);
      const fontSize = Number.parseFloat(style.fontSize) || 48;
      const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
      const mask = document.createElement("canvas");
      mask.width = width;
      mask.height = height;
      const maskContext = mask.getContext("2d", { willReadFrequently: true });
      if (!maskContext) return;

      maskContext.clearRect(0, 0, width, height);
      maskContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      maskContext.textAlign = "left";
      maskContext.textBaseline = "middle";

      const glyphs = Array.from(text);
      const advances = glyphs.map((glyph) => maskContext.measureText(glyph).width + letterSpacing);
      const textWidth = advances.reduce((total, advance) => total + advance, 0) - letterSpacing;
      let cursor = (width - textWidth) / 2;
      const baseline = height / 2;

      for (let index = 0; index < glyphs.length; index += 1) {
        maskContext.fillText(glyphs[index], cursor, baseline);
        cursor += advances[index];
      }

      const maskData = maskContext.getImageData(0, 0, width, height).data;
      const spacing = Math.max(2, Math.min(3, fontSize / 20));
      particles = [];

      for (let y = spacing * 0.5; y < height; y += spacing) {
        for (let x = spacing * 0.5; x < width; x += spacing) {
          const pixel = (Math.floor(y) * width + Math.floor(x)) * 4 + 3;
          if (maskData[pixel] < 100) continue;

          const seed = seededValue(x, y, fontSize);
          particles.push({
            x,
            y,
            radius: seed > 0.9 ? 1.15 : 0.62 + seed * 0.28,
            phase: seed * Math.PI * 2,
            drift: 0.18 + seed * 0.45,
            accent: seed > 0.78,
          });
        }
      }

      if (reducedMotion) draw(0);
      else startAnimation();
    };

    const scheduleBuild = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        build();
      });
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => {
      reducedMotion = motionQuery.matches;
      if (reducedMotion && animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      scheduleBuild();
    };

    host.dataset.particleTextReady = "true";
    const resizeObserver = new ResizeObserver(scheduleBuild);
    resizeObserver.observe(host);
    motionQuery.addEventListener("change", handleMotionChange);
    build();
    void document.fonts?.ready.then(scheduleBuild);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      delete host.dataset.particleTextReady;
    };
  }, [text]);

  return <canvas ref={canvasRef} className="particle-text-canvas" aria-hidden="true" />;
}
