"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = (mobile: boolean) => `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec2 uMouseVelocity;
  uniform float uRipple;
  uniform float uIntensity;

  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    float lower = mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x);
    float upper = mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x);
    return mix(lower, upper, local.y);
  }

  float fluidNoise(vec2 point) {
    ${mobile ? "return noise(point);" : `
    float value = 0.0;
    float amplitude = 0.5;
    vec2 samplePoint = point;

    for (int octave = 0; octave < 3; octave++) {
      value += noise(samplePoint) * amplitude;
      samplePoint = samplePoint * 2.0 + vec2(13.7, 7.1);
      amplitude *= 0.5;
    }

    return value;
    `}
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 point = vUv - 0.5;
    point.x *= aspect;

    vec2 cursor = uMouse - 0.5;
    cursor.x *= aspect;

    vec2 fromCursor = point - cursor;
    float distanceToCursor = length(fromCursor);
    float ripplePulse = 0.5 + 0.5 * sin(distanceToCursor * 34.0 - uTime * 4.0 + length(uMouseVelocity) * 3.0);
    float rippleField = exp(-distanceToCursor * distanceToCursor * 34.0) * uRipple;

    vec2 flowPoint = vUv * 2.4 + vec2(uTime * 0.018, -uTime * 0.014);
    float flow = fluidNoise(flowPoint);
    float secondaryFlow = fluidNoise(flowPoint * 1.7 + vec2(4.0, -2.0));
    vec2 distortion = vec2(flow - 0.5, secondaryFlow - 0.5) * 0.012 * uIntensity;

    vec2 direction = fromCursor / max(distanceToCursor, 0.001);
    distortion += direction * rippleField * (0.002 + ripplePulse * 0.004) * uIntensity;

    vec2 samplePoint = vUv + distortion;
    float liquid = fluidNoise(samplePoint * 2.2 + vec2(-uTime * 0.012, uTime * 0.009));
    float detail = noise(samplePoint * 7.0 - vec2(uTime * 0.01, -uTime * 0.008));
    float quietHighlight = smoothstep(0.30, 0.70, liquid) * 0.30 + detail * 0.06;
    float rippleHighlight = rippleField * (0.28 + ripplePulse * 0.32);

    vec3 base = vec3(0.046, 0.042, 0.037);
    vec3 warmLight = vec3(0.70, 0.58, 0.44) * (quietHighlight + rippleHighlight) * uIntensity;
    vec3 color = base + warmLight;
    float alpha = 0.26 + quietHighlight * 0.40 + rippleHighlight * 0.85;
    gl_FragColor = vec4(color, alpha);
  }
`;

type PointerState = {
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  targetVelocityX: number;
  targetVelocityY: number;
  velocityX: number;
  velocityY: number;
  ripple: number;
  lastX: number;
  lastY: number;
  lastTime: number;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, mobile: boolean): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER(mobile));
  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;
    const glContext = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
      stencil: false,
    });

    if (!glContext) {
      canvas.classList.add("liquid-background-fallback");
      return;
    }

    const gl = glContext;
    const program = createProgram(gl, mobile);
    if (!program) {
      canvas.classList.add("liquid-background-fallback");
      return;
    }

    const position = gl.getAttribLocation(program, "aPosition");
    const buffer = gl.createBuffer();
    if (position < 0 || !buffer) {
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      canvas.classList.add("liquid-background-fallback");
      return;
    }

    const uniforms = {
      intensity: gl.getUniformLocation(program, "uIntensity"),
      mouse: gl.getUniformLocation(program, "uMouse"),
      mouseVelocity: gl.getUniformLocation(program, "uMouseVelocity"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      ripple: gl.getUniformLocation(program, "uRipple"),
      time: gl.getUniformLocation(program, "uTime"),
    };
    const pointer: PointerState = {
      targetX: 0.5,
      targetY: 0.5,
      x: 0.5,
      y: 0.5,
      targetVelocityX: 0,
      targetVelocityY: 0,
      velocityX: 0,
      velocityY: 0,
      ripple: 0,
      lastX: 0.5,
      lastY: 0.5,
      lastTime: 0,
    };
    const intensity = mobile ? 0.56 : 0.72;
    let animationFrame: number | null = null;
    let disposed = false;
    let lastFrameTime = performance.now();
    let width = 1;
    let height = 1;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.floor(window.innerWidth * pixelRatio));
      height = Math.max(1, Math.floor(window.innerHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      if (reducedMotion) draw(0);
    };

    function draw(time: number) {
      if (disposed) return;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uniforms.time, time);
      gl.uniform1f(uniforms.intensity, intensity);
      gl.uniform2f(uniforms.mouse, pointer.x, 1 - pointer.y);
      gl.uniform2f(uniforms.mouseVelocity, pointer.velocityX, pointer.velocityY);
      gl.uniform2f(uniforms.resolution, width, height);
      gl.uniform1f(uniforms.ripple, pointer.ripple);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    const stopAnimation = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const render = (now: number) => {
      animationFrame = null;
      if (disposed || document.visibilityState === "hidden") return;

      const delta = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
      lastFrameTime = now;
      const mouseSmoothing = 1 - Math.exp(-delta * 7);
      const velocitySmoothing = 1 - Math.exp(-delta * 10);
      pointer.x += (pointer.targetX - pointer.x) * mouseSmoothing;
      pointer.y += (pointer.targetY - pointer.y) * mouseSmoothing;
      pointer.velocityX += (pointer.targetVelocityX - pointer.velocityX) * velocitySmoothing;
      pointer.velocityY += (pointer.targetVelocityY - pointer.velocityY) * velocitySmoothing;
      pointer.targetVelocityX *= Math.exp(-delta * 7);
      pointer.targetVelocityY *= Math.exp(-delta * 7);
      pointer.velocityX *= Math.exp(-delta * 2.4);
      pointer.velocityY *= Math.exp(-delta * 2.4);
      pointer.ripple *= Math.exp(-delta * (mobile ? 3.8 : 3.1));

      draw(now / 1000);
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
    };

    const startAnimation = () => {
      if (disposed || reducedMotion || document.visibilityState === "hidden" || animationFrame !== null) return;
      lastFrameTime = performance.now();
      animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const nextX = clamp(event.clientX / Math.max(window.innerWidth, 1), 0, 1);
      const nextY = clamp(event.clientY / Math.max(window.innerHeight, 1), 0, 1);
      const now = performance.now();
      const elapsed = pointer.lastTime ? Math.max(0.016, (now - pointer.lastTime) / 1000) : 0.016;
      const deltaX = nextX - pointer.lastX;
      const deltaY = nextY - pointer.lastY;
      const speed = clamp(Math.hypot(deltaX, deltaY) / elapsed * 0.045, 0, 1);

      pointer.targetX = nextX;
      pointer.targetY = nextY;
      pointer.targetVelocityX = clamp(deltaX / elapsed * 0.025, -1, 1);
      pointer.targetVelocityY = clamp(deltaY / elapsed * 0.025, -1, 1);
      pointer.ripple = Math.min(1, pointer.ripple + 0.12 + speed * 0.2);
      pointer.lastX = nextX;
      pointer.lastY = nextY;
      pointer.lastTime = now;
    };

    const handleVisibilityChange = () => {
      stopAnimation();
      if (document.visibilityState === "visible") {
        lastFrameTime = performance.now();
        if (reducedMotion) draw(0);
        else startAnimation();
      }
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      stopAnimation();
      if (reducedMotion) {
        pointer.ripple = 0;
        pointer.targetVelocityX = 0;
        pointer.targetVelocityY = 0;
        draw(0);
      } else {
        startAnimation();
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      stopAnimation();
      canvas.classList.add("liquid-background-fallback");
    };

    resize();
    draw(0);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    if (!reducedMotion) startAnimation();

    return () => {
      disposed = true;
      stopAnimation();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="liquid-background" aria-hidden="true" />;
}
