"use client";

import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const CANVAS = 220;
const ORB_R = 66;
const RINGS = 16;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOT_LIST = (() => {
  const rand = mulberry32(7);
  const out: { x: number; y: number; z: number; u: number; seed: number }[] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(30 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * TAU + k * 0.35;
      out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, u: (1 - y) / 2, seed: rand() * TAU });
    }
  }
  return out;
})();

const N = DOT_LIST.length;
const DX = Float32Array.from(DOT_LIST, (d) => d.x);
const DY = Float32Array.from(DOT_LIST, (d) => d.y);
const DZ = Float32Array.from(DOT_LIST, (d) => d.z);
const DU = Float32Array.from(DOT_LIST, (d) => d.u);
const DS = Float32Array.from(DOT_LIST, (d) => d.seed);

const G_STEPS = 24;
const A_STEPS = 48;
const COLORS: string[] = (() => {
  const out: string[] = [];
  for (let gi = 0; gi <= G_STEPS; gi++) {
    const g = gi / G_STEPS;
    const r = Math.round(lerp(235, 52, g));
    const gg = Math.round(lerp(235, 211, g));
    const b = Math.round(lerp(235, 153, g));
    for (let ai = 0; ai <= A_STEPS; ai++) {
      out.push(`rgba(${r},${gg},${b},${(ai / A_STEPS).toFixed(3)})`);
    }
  }
  return out;
})();

const STAGES = [
  { label: "Thinking", detail: "Reading your setup and risk profile." },
  { label: "Searching", detail: "Scanning the fictional sports slate." },
  { label: "Analyzing", detail: "Filtering and ranking matching signals." },
  { label: "Composing", detail: "Gathering your demo picks for review." },
] as const;

export function MorphThinkingOrb({ stage = 0 }: { stage?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clampedStage = Math.max(0, Math.min(3, stage));
  const stageRef = useRef(clampedStage);

  useEffect(() => { stageRef.current = clampedStage; }, [clampedStage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CANVAS * dpr);
    canvas.height = Math.round(CANVAS * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const lit = new Float32Array(N);
    const sx = new Float32Array(N);
    const sy = new Float32Array(N);
    const sr = new Float32Array(N);
    const sd = new Float32Array(N);
    const sc = new Int16Array(N);
    const programWeights = [1, 0, 0, 0];

    const S = 0.6;
    const CP = Math.cos(0.35);
    const SP = Math.sin(0.35);
    const C0 = CANVAS / 2;

    let time = reduced.matches ? 1.2 : 0;
    let rot = 0;
    let reveal = reduced.matches ? 1 : 0;
    let alpha = reduced.matches ? 1 : 0;
    let raf = 0;
    let last = performance.now();
    let dead = false;

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, CANVAS, CANVAS);

      time += dt;
      rot += 0.9 * dt;
      reveal += (1 - reveal) * Math.min(1, dt * 4.6);
      alpha += (1 - alpha) * Math.min(1, dt * 4.6);

      const prog = stageRef.current;
      const stepW = dt / 0.35;
      for (let q = 0; q < 4; q++) {
        const d = (q === prog ? 1 : 0) - programWeights[q];
        programWeights[q] += Math.abs(d) <= stepW ? d : d > 0 ? stepW : -stepW;
      }

      const sweep = prog === 3 ? clamp01((time % 1.8) / 1.25) : 0;
      const floor = prog === 3 ? 0.32 : 0;
      const rad = prog === 3 ? 0.05 : 0;
      const decay = Math.exp(-dt / 0.5);
      const h0 = (time * 300) % N;
      const h3 = (time * 480) % N;
      const a1 = time * 0.8;
      const b1 = Math.sin(time * 0.5) * 0.9;
      const f1x = Math.cos(b1) * Math.cos(a1);
      const f1y = Math.sin(b1);
      const f1z = Math.cos(b1) * Math.sin(a1);
      const a2 = time * 0.55 + 2.1;
      const b2 = Math.cos(time * 0.42) * 0.9;
      const f2x = Math.cos(b2) * Math.cos(a2);
      const f2y = Math.sin(b2);
      const f2z = Math.cos(b2) * Math.sin(a2);
      const lat = Math.sin(time * 2.2);
      const yaw = rot;
      const cyw = Math.cos(yaw);
      const syw = Math.sin(yaw);

      for (let n = 0; n < N; n++) {
        const dx = DX[n], dy = DY[n], dz = DZ[n], u = DU[n];

        let pulse = 0;
        if (programWeights[0] > 0.001) {
          let dd = Math.abs(n - h0);
          if (dd > N - dd) dd = N - dd;
          const v = Math.max(0, 1 - dd / 16);
          pulse = Math.max(pulse, v * v * programWeights[0]);
        }
        if (programWeights[1] > 0.001) {
          const v1 = Math.max(0, (dx * f1x + dy * f1y + dz * f1z - 0.72) / 0.28);
          const v2 = Math.max(0, (dx * f2x + dy * f2y + dz * f2z - 0.72) / 0.28);
          const v = Math.max(v1, v2);
          pulse = Math.max(pulse, v * v * programWeights[1]);
        }
        if (programWeights[2] > 0.001) {
          const e = dy - lat;
          const v = Math.max(0, 1 - (e * e) / 0.02);
          pulse = Math.max(pulse, v * v * programWeights[2]);
        }
        if (programWeights[3] > 0.001) {
          let dd = Math.abs(n - h3);
          if (dd > N - dd) dd = N - dd;
          const v = Math.max(0, 1 - dd / 22);
          pulse = Math.max(pulse, v * v * programWeights[3]);
        }

        const light = Math.max(lit[n] * decay, pulse);
        lit[n] = light;

        const ki = clamp01(reveal * (1 + S) - S * u);
        if (ki <= 0.001) {
          sc[n] = -1;
          continue;
        }

        const eo = 1 - Math.pow(1 - ki, 3);
        const x1 = dx * cyw + dz * syw;
        const z1 = -dx * syw + dz * cyw;
        const y2 = dy * CP - z1 * SP;
        const z2 = dy * SP + z1 * CP;
        const f = 2.8 / (2.8 - z2);
        const depth = (z2 + 1) / 2;

        const ox = x1 * ORB_R * eo * f;
        const oy = -y2 * ORB_R * eo * f;

        const g = clamp01((sweep * 1.4 - u) / 0.4);
        let a = 0.1
          + 0.035 * Math.sin(DS[n] + time * 1.6) * (1 - g)
          + 0.32 * depth * depth
          + 0.75 * light * (1 - g)
          + g * (0.55 + 0.4 * depth)
          + 2 * g * (1 - g);

        a = Math.max(a, floor * (0.7 + 0.3 * depth));
        a = Math.min(1, a) * eo * alpha;

        sx[n] = C0 + ox;
        sy[n] = C0 + oy;
        sd[n] = depth;
        sr[n] = (1.15 * (0.45 + 0.75 * depth) * f + 0.9 * light + g * 0.25) * (1 + rad) * (0.4 + 0.6 * eo);

        const ai = Math.round(a * A_STEPS);
        const gi = Math.round(g * G_STEPS);
        sc[n] = ai <= 0 ? -1 : gi * (A_STEPS + 1) + ai;
      }

      for (let pass = 0; pass < 2; pass++) {
        for (let n = 0; n < N; n++) {
          const color = sc[n];
          if (color < 0) continue;
          if ((sd[n] >= 0.5) !== (pass === 1)) continue;
          ctx.fillStyle = COLORS[color];
          ctx.beginPath();
          ctx.arc(sx[n], sy[n], sr[n], 0, TAU);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      if (dead) return;
      const dt = reduced.matches ? 0.016 : Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      draw(dt);
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      dead = true;
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const current = STAGES[clampedStage];

  return (
    <div className="morph-thinking" aria-live="polite" aria-busy="true">
      <div className="morph-thinking-halo" aria-hidden="true" />
      <canvas ref={canvasRef} className="morph-thinking-canvas" aria-hidden="true" />
      <div className="morph-thinking-status">
        <div className="morph-thinking-label" key={current.label}>
          <span>{current.label}</span>
          <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
        </div>
        <p>{current.detail}</p>
        <small>RØGUE AGENT · DEMO DATA · SIMULATION ONLY</small>
      </div>
    </div>
  );
}
