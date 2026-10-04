"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ThinkingOrbMode, ThinkingOrbProps } from "./types";
import styles from "./thinking-orb.module.css";

const TAU = Math.PI * 2;
const CANVAS = 560;
const RINGS = 20;
const READOUTS = [
  { value: "54%", label: "MODEL" },
  { value: "+09", label: "GAP / PTS" },
  { value: "LOW", label: "UNCERTAINTY" },
  { value: "FORM", label: "SPORTS" },
  { value: "DEMO", label: "SOURCE" },
] as const;

type OrbPoint = { x: number; y: number; z: number; seed: number };
type Link = readonly [number, number];
type BaseThinkingOrbProps = Omit<ThinkingOrbProps, "variant" | "mode"> & {
  mode: ThinkingOrbMode;
};

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createOrbGeometry() {
  const random = mulberry32(19);
  const points: OrbPoint[] = [];
  const links: Link[] = [];
  const ringStarts: number[] = [];
  const ringCounts: number[] = [];

  for (let ring = 0; ring < RINGS; ring += 1) {
    const y = 1 - ((ring + 0.5) / RINGS) * 2;
    const radius = Math.sqrt(1 - y * y);
    const count = Math.max(12, Math.round(34 * radius));
    const start = points.length;
    ringStarts.push(start);
    ringCounts.push(count);

    for (let slot = 0; slot < count; slot += 1) {
      const angle = (slot / count) * TAU + ring * 0.29;
      points.push({
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius,
        seed: random() * TAU,
      });
    }

    for (let slot = 0; slot < count; slot += 1) {
      links.push([start + slot, start + ((slot + 1) % count)]);
      if (ring > 0) {
        const previous = ringStarts[ring - 1];
        const previousCount = ringCounts[ring - 1];
        links.push([start + slot, previous + Math.round((slot / count) * previousCount) % previousCount]);
      }
    }
  }

  return { points, links };
}

const GEOMETRY = createOrbGeometry();

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function projectPoint(point: OrbPoint, rotation: number, scale: number, mode: ThinkingOrbMode, time: number) {
  let x = point.x;
  let y = point.y;
  let z = point.z;

  if (mode === "wave" || mode === "ribbon") {
    y += Math.sin(x * 5 + time * 1.7 + point.seed) * 0.06;
  }
  if (mode === "braid") {
    const twist = y * 1.7 + time * 0.35;
    const braidX = x * Math.cos(twist) - z * Math.sin(twist);
    z = x * Math.sin(twist) + z * Math.cos(twist);
    x = braidX;
  }
  if (mode === "rubik" || mode === "morph") {
    const slice = Math.sin(time * 0.55) > 0 ? 1 : -1;
    const quarter = Math.sin(time * 0.55) * 0.18 * slice;
    const rotatedX = x * Math.cos(quarter) - z * Math.sin(quarter);
    z = x * Math.sin(quarter) + z * Math.cos(quarter);
    x = rotatedX;
  }

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotatedX = x * cos - z * sin;
  const rotatedZ = x * sin + z * cos;
  const depth = (rotatedZ + 1) / 2;
  const perspective = 1.05 + depth * 0.22;
  const radius = 178 * scale;

  return {
    x: CANVAS / 2 + rotatedX * radius * perspective,
    y: CANVAS / 2 - y * radius * perspective,
    depth,
    radius: (1.45 + depth * 2.2) * scale,
  };
}

export function BaseThinkingOrb({
  mode,
  caption,
  summary,
  frame = [240, 240],
  size = frame[0],
  speed = 1,
  scale = 0.78,
  playback = "play",
  surface = "auto",
  showMeta = true,
  className,
}: BaseThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const safeSpeed = clamp(speed, 0.2, 2.4);
  const safeScale = clamp(scale, 0.58, 1.15);
  const logicalSize = clamp(size, 240, 720);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CANVAS * dpr);
    canvas.height = Math.round(CANVAS * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const center = CANVAS / 2;
    const orbRadius = 184 * safeScale;
    const glow = context.createRadialGradient(center, center, orbRadius * 0.08, center, center, orbRadius * 1.25);
    const isLight = surface === "light";
    glow.addColorStop(0, isLight ? "rgba(66,82,83,.08)" : "rgba(199,220,211,.09)");
    glow.addColorStop(0.54, isLight ? "rgba(91,130,126,.035)" : "rgba(111,177,166,.04)");
    glow.addColorStop(1, "rgba(0,0,0,0)");

    let animationFrame = 0;
    let last = performance.now();
    let time = reducedMotion ? 2.4 : 0;
    let disposed = false;

    const draw = (delta: number) => {
      if (disposed) return;
      const elapsed = reducedMotion || playback === "pause" ? 0 : delta;
      time += elapsed * safeSpeed;
      context.clearRect(0, 0, CANVAS, CANVAS);

      context.save();
      context.globalCompositeOperation = "source-over";
      context.fillStyle = glow;
      context.beginPath();
      context.arc(center, center, orbRadius * 1.22, 0, TAU);
      context.fill();
      context.restore();

      context.save();
      context.translate(center, center);
      context.rotate(-0.18);
      context.globalAlpha = 0.18;
      context.strokeStyle = isLight ? "rgba(47,72,73,.28)" : "rgba(197,219,211,.22)";
      context.lineWidth = 1;
      for (let ring = 0; ring < 4; ring += 1) {
        const radius = orbRadius * (0.82 + ring * 0.14);
        context.beginPath();
        context.ellipse(0, 0, radius, radius * (0.22 + ring * 0.08), ring * 0.22, 0, TAU);
        context.stroke();
      }
      context.restore();

      const projected = GEOMETRY.points.map((point) => projectPoint(point, time * 0.32, safeScale, mode, time));

      if (mode === "web" || mode === "globe" || mode === "orbits") {
        context.save();
        context.lineWidth = mode === "web" ? 1 : 0.7;
        for (const [from, to] of GEOMETRY.links) {
          const start = projected[from];
          const end = projected[to];
          const alpha = (0.02 + ((start.depth + end.depth) / 2) * (mode === "web" ? 0.1 : 0.07));
          context.strokeStyle = isLight
            ? `rgba(49,79,79,${alpha})`
            : `rgba(150,201,191,${alpha})`;
          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);
          context.stroke();
        }
        context.restore();
      }

      context.save();
      for (let index = 0; index < projected.length; index += 1) {
        const point = projected[index];
        const source = GEOMETRY.points[index];
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.2 + source.seed);
        const alpha = 0.08 + point.depth * 0.52 + pulse * 0.04;
        const accent = index % 17 === 0 || (mode === "web" && index % 23 === 0);
        const color = accent
          ? (isLight ? "226,181,113" : "228,210,166")
          : (isLight ? "59,113,108" : "161,205,194");
        context.fillStyle = `rgba(${color},${clamp(alpha, 0.06, 0.68)})`;
        context.beginPath();
        context.arc(point.x, point.y, point.radius * (accent ? 1.15 : 0.86), 0, TAU);
        context.fill();
      }
      context.restore();

      context.save();
      context.translate(center, center);
      const sweep = (time * 0.2) % TAU;
      context.rotate(sweep);
      context.strokeStyle = isLight ? "rgba(176,135,77,.42)" : "rgba(220,208,170,.48)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(0, 0, orbRadius * 1.03, -0.42, 0.3);
      context.stroke();
      context.restore();

      if (playback === "pause" || reducedMotion) return;
      animationFrame = window.requestAnimationFrame((now) => {
        const nextDelta = Math.max(0, Math.min(0.05, (now - last) / 1000));
        last = now;
        draw(nextDelta);
      });
    };

    draw(0.016);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
    };
  }, [logicalSize, mode, playback, reducedMotion, safeScale, safeSpeed, surface]);

  const rootStyle = {
    "--orb-width": `${frame[0]}px`,
    "--orb-ratio": `${frame[0]} / ${frame[1]}`,
    "--orb-play-state": playback === "play" && !reducedMotion ? "running" : "paused",
    "--readout-duration": `${Math.max(4.8, 7.2 / safeSpeed)}s`,
  } as CSSProperties;

  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      style={rootStyle}
      data-mode={mode}
      data-surface={surface}
      role="img"
      aria-label={caption ?? "Sports simulation visual"}
    >
      <canvas ref={canvasRef} className={styles.canvas} width={CANVAS} height={CANVAS} aria-hidden="true" />
      <div className={styles.readoutStream} aria-hidden="true">
        {READOUTS.map((readout, index) => (
          <span
            className={styles.readout}
            key={readout.label}
            style={{
              "--readout-delay": `${index * -1.45}s`,
              "--readout-x": `${(index % 2 === 0 ? -1 : 1) * (18 + index * 7)}px`,
              "--readout-rotate": `${(index % 2 === 0 ? -1 : 1) * (index + 1)}deg`,
            } as CSSProperties}
          >
            <strong className={styles.readoutValue}>{readout.value}</strong>
            <small className={styles.readoutLabel}>{readout.label}</small>
          </span>
        ))}
      </div>
      <div className={styles.coreMark} aria-hidden="true" />
      {showMeta && caption ? <div className={styles.meta} aria-hidden="true"><span className={styles.metaDot} />{caption}</div> : null}
      {summary ? <span className={styles.srOnly}>{summary}</span> : null}
    </div>
  );
}
