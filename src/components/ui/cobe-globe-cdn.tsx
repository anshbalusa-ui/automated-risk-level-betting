"use client"

import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import createGlobe, { type Globe } from "cobe"

interface CdnMarker {
  id: string
  location: [number, number]
  region: string
}

interface CdnArc {
  id: string
  from: [number, number]
  to: [number, number]
}

interface GlobeCdnProps {
  markers?: CdnMarker[]
  arcs?: CdnArc[]
  className?: string
  speed?: number
}

const defaultMarkers: CdnMarker[] = [
  { id: "cdn-iad", location: [38.95, -77.45], region: "iad1" },
  { id: "cdn-sfo", location: [37.62, -122.38], region: "sfo1" },
  { id: "cdn-cdg", location: [49.01, 2.55], region: "cdg1" },
  { id: "cdn-hnd", location: [35.55, 139.78], region: "hnd1" },
  { id: "cdn-syd", location: [-33.95, 151.18], region: "syd1" },
  { id: "cdn-gru", location: [-23.43, -46.47], region: "gru1" },
  { id: "cdn-sin", location: [1.36, 103.99], region: "sin1" },
  { id: "cdn-arn", location: [59.65, 17.93], region: "arn1" },
  { id: "cdn-dub", location: [53.43, -6.25], region: "dub1" },
  { id: "cdn-bom", location: [19.09, 72.87], region: "bom1" },
]

const defaultArcs: CdnArc[] = [
  { id: "cdn-arc-1", from: [38.95, -77.45], to: [49.01, 2.55] },
  { id: "cdn-arc-2", from: [37.62, -122.38], to: [35.55, 139.78] },
  { id: "cdn-arc-3", from: [49.01, 2.55], to: [1.36, 103.99] },
  { id: "cdn-arc-4", from: [38.95, -77.45], to: [-23.43, -46.47] },
  { id: "cdn-arc-5", from: [35.55, 139.78], to: [-33.95, 151.18] },
  { id: "cdn-arc-6", from: [49.01, 2.55], to: [19.09, 72.87] },
]

const trafficBaseline = [420, 380, 290, 185, 156, 134]


export function GlobeCdn({
  markers = defaultMarkers,
  arcs = defaultArcs,
  className = "",
  speed = 0.003,
}: GlobeCdnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const reducedMotionRef = useRef(false)
  const traffic = arcs.map((arc, index) => ({ id: arc.id, value: trafficBaseline[index] || 100 }))

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = { x: event.clientX, y: event.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (event.clientX - pointerInteracting.current.x) / 300,
          theta: (event.clientY - pointerInteracting.current.y) / 1000,
        }
      }
    }
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: Globe | null = null
    let animationId: number | null = null
    let revealTimeout: number | null = null
    let phi = 0
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotionPreference = () => {
      reducedMotionRef.current = preference.matches
    }

    syncMotionPreference()
    preference.addEventListener("change", syncMotionPreference)

    const init = () => {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 10,
        baseColor: [1, 1, 1],
        markerColor: [0, 0, 0],
        glowColor: [0.94, 0.93, 0.91],
        markerElevation: 0.02,
        markers: markers.map((marker) => ({ location: marker.location, size: 0.012, id: marker.id })),
        arcs: arcs.map((arc) => ({ from: arc.from, to: arc.to, id: arc.id })),
        arcColor: [0, 0, 0],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.7,
      })

      const animate = () => {
        if (!isPausedRef.current && !reducedMotionRef.current) phi += speed
        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        })
        animationId = window.requestAnimationFrame(animate)
      }

      animate()
      revealTimeout = window.setTimeout(() => {
        canvas.style.opacity = "1"
      }, 80)
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          resizeObserver.disconnect()
          init()
        }
      })
      resizeObserver.observe(canvas)
    }

    return () => {
      preference.removeEventListener("change", syncMotionPreference)
      if (animationId !== null) window.cancelAnimationFrame(animationId)
      if (revealTimeout !== null) window.clearTimeout(revealTimeout)
      globe?.destroy()
    }
  }, [arcs, markers, speed])


  const pyramidFaceStyle = (nth: number): CSSProperties => {
    const transforms = [
      "rotateY(0deg) translateZ(4px) rotateX(19.5deg)",
      "rotateY(120deg) translateZ(4px) rotateX(19.5deg)",
      "rotateY(240deg) translateZ(4px) rotateX(19.5deg)",
      "rotateX(-90deg) rotateZ(60deg) translateY(4px)",
    ]
    const colors = ["#111", "#333", "#555", "#222"]
    return {
      position: "absolute",
      left: -0.5,
      top: 0,
      width: 0,
      height: 0,
      borderLeft: "6.5px solid transparent",
      borderRight: "6.5px solid transparent",
      borderBottom: `13px solid ${colors[nth]}`,
      transformOrigin: "center bottom",
      transform: transforms[nth],
    }
  }

  return (
    <div className={`relative aspect-square select-none ${className}`} role="group" aria-label="Global demo probability map">
      <style>{`
        @keyframes pyramid-spin {
          0% { transform: rotateX(20deg) rotateY(0deg); }
          100% { transform: rotateX(20deg) rotateY(360deg); }
        }
      `}</style>
      <svg className="globe-orbits" viewBox="-14 -14 128 128" aria-hidden="true">
        <g className="globe-orbit globe-orbit--a">
          <ellipse cx="50" cy="50" rx="56" ry="18" transform="rotate(-18 50 50)" />
        </g>
        <g className="globe-orbit globe-orbit--b">
          <ellipse cx="50" cy="50" rx="57" ry="12" transform="rotate(42 50 50)" />
        </g>
        <g className="globe-orbit globe-orbit--c">
          <ellipse cx="50" cy="50" rx="48" ry="29" transform="rotate(72 50 50)" />
        </g>
        <circle className="globe-orbit-node globe-orbit-node--a" cx="10" cy="48" r="0.9" />
        <circle className="globe-orbit-node globe-orbit-node--b" cx="83" cy="14" r="0.75" />
        <circle className="globe-orbit-node globe-orbit-node--c" cx="96" cy="72" r="0.65" />
      </svg>
      <div className="globe-static-fallback" role="img" aria-label="Static demo probability map" />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive globe showing probability regions and routes"
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      <div className="globe-static-overlay" aria-hidden="true" />
      {markers.map((marker) => (
        <div
          className="globe-route-marker"
          key={marker.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-${marker.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
            opacity: "var(--cobe-visible-" + marker.id + ", 0)",
            filter: "blur(calc((1 - var(--cobe-visible-" + marker.id + ", 0)) * 8px))",
            transition: "opacity 0.3s, filter 0.3s",
          }}
        >
          <div className="globe-route-pyramid"
            style={{
              width: 12,
              height: 12,
              position: "relative",
              transformStyle: "preserve-3d",
              animation: "pyramid-spin 4s linear infinite",
            }}
          >
            {[0, 1, 2, 3].map((face) => (
              <div key={face} style={pyramidFaceStyle(face)} />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-site)",
              fontSize: "0.55rem",
              color: "#000",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: 3,
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {marker.region}
          </span>
        </div>
      ))}
      {traffic.map((item) => (
        <div
          className="globe-route-traffic"
          key={item.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-arc-${item.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            fontFamily: "var(--font-site)",
            fontSize: "0.5rem",
            color: "#fff",
            background: "#000",
            padding: "3px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            opacity: "var(--cobe-visible-arc-" + item.id + ", 0)",
            filter: "blur(calc((1 - var(--cobe-visible-arc-" + item.id + ", 0)) * 8px))",
            transition: "opacity 0.3s, filter 0.3s",
          }}
        >
          {item.value}k credits/s
        </div>
      ))}
    </div>
  )
}
