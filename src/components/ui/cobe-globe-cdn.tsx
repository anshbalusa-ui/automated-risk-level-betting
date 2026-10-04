"use client"

import { useCallback, useEffect, useId, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
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
const globeTextureLongitudes = [
  "M 18 -8 C 40 16 40 84 18 108",
  "M 30 -8 C 46 17 46 83 30 108",
  "M 42 -8 C 49 18 49 82 42 108",
  "M 58 -8 C 51 18 51 82 58 108",
  "M 70 -8 C 54 17 54 83 70 108",
  "M 82 -8 C 60 16 60 84 82 108",
]

const globeTextureLatitudes = [
  "M -8 18 C 18 8 82 8 108 18",
  "M -8 31 C 22 22 78 22 108 31",
  "M -8 45 C 24 40 76 40 108 45",
  "M -8 59 C 24 64 76 64 108 59",
  "M -8 73 C 22 82 78 82 108 73",
  "M -8 86 C 18 96 82 96 108 86",
]

const globeTextureContours = [
  { rx: 43, ry: 25, rotate: -18 },
  { rx: 34, ry: 20, rotate: -18 },
  { rx: 25, ry: 15, rotate: -18 },
  { rx: 16, ry: 10, rotate: -18 },
]


export function GlobeCdn({
  markers = defaultMarkers,
  arcs = defaultArcs,
  className = "",
  speed = 0.003,
}: GlobeCdnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textureClipId = useId().replace(/:/g, "")
  const textureRef = useRef<HTMLDivElement>(null)
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
  useEffect(() => {
    const texture = textureRef.current
    if (!texture) return
    const targetOpacity = window.getComputedStyle(texture).opacity

    // Cobe promotes its canvas after mount; the delayed opacity flip repaints this overlay above it.
    let frame: number | null = null
    const repaint = window.setTimeout(() => {
      texture.style.transform = "translate3d(0,0,0)"
      texture.style.opacity = "0"
      frame = window.requestAnimationFrame(() => {
        texture.style.opacity = targetOpacity
      })
    }, 240)

    return () => {
      window.clearTimeout(repaint)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [])


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
    <div className={`relative aspect-square select-none ${className}`} role="group" aria-label="Global demo signal map">
      <style>{`
        @keyframes pyramid-spin {
          0% { transform: rotateX(20deg) rotateY(0deg); }
          100% { transform: rotateX(20deg) rotateY(360deg); }
        }
      `}</style>
      <div className="globe-static-fallback" role="img" aria-label="Static demo signal map" />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive globe showing demo signal regions and routes"
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
      <div ref={textureRef} className="globe-texture" aria-hidden="true">
        <svg className="globe-texture-svg" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <clipPath id={textureClipId}>
              <circle cx="50" cy="50" r="49.5" />
            </clipPath>
          </defs>
          <g
            clipPath={`url(#${textureClipId})`}
            fill="none"
            stroke="#090909"
            strokeLinecap="round"
            strokeOpacity=".48"
            strokeWidth=".38"
          >
            {globeTextureLongitudes.map((path) => <path key={path} d={path} />)}
            {globeTextureLatitudes.map((path) => <path key={path} d={path} />)}
          </g>
          <g
            clipPath={`url(#${textureClipId})`}
            fill="none"
            stroke="#fff"
            strokeLinecap="round"
            strokeOpacity=".22"
            strokeWidth=".3"
          >
            {globeTextureLongitudes.slice(1, 5).map((path) => <path key={`highlight-${path}`} d={path} />)}
          </g>
          <g
            clipPath={`url(#${textureClipId})`}
            fill="none"
            stroke="#090909"
            strokeLinecap="round"
            strokeOpacity=".55"
            strokeWidth=".45"
          >
            {globeTextureContours.map(({ rx, ry, rotate }) => (
              <ellipse key={`${rx}-${ry}`} cx="50" cy="50" rx={rx} ry={ry} transform={`rotate(${rotate} 50 50)`} />
            ))}
          </g>
        </svg>
      </div>
      {markers.map((marker) => (
        <div
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
          <div className="globe-signal-pyramid"
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
              fontFamily: "monospace",
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
          key={item.id}
          style={{
            position: "absolute",
            positionAnchor: `--cobe-arc-${item.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            fontFamily: "monospace",
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
