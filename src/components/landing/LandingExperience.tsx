"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";
import { ShaderBackground } from "@/components/ui/213";
import { defaultPreferences, runAgent } from "@/lib/agent";
import { GraphStoryPanel } from "./GraphStory";
import styles from "./LandingNarrative.module.css";

// Fixed-date demo values are independent of a visitor's persisted run.
const videoProps = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  controls: false,
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  controlsList: "nodownload noplaybackrate noremoteplayback",
};

const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));
const filmPulls = [
  { delay: 0.04, gain: 1.08 },
  { delay: 0.1, gain: 1.12 },
  { delay: 0.14, gain: 1.1 },
  { delay: 0.07, gain: 1.04 },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(value: number) {
  const next = clamp(value);
  return next * next * (3 - 2 * next);
}

const markFilmFailed = (event: SyntheticEvent<HTMLVideoElement>) => {
  event.currentTarget.parentElement?.classList.add("sports-film-media-failed");
};

export default function LandingExperience() {
  const router = useRouter();
  const storyRef = useRef<HTMLElement>(null);
  const filmStage = useRef<HTMLDivElement>(null);
  const filmRefs = useRef<(HTMLElement | null)[]>([]);
  const [graphProgress, setGraphProgress] = useState(0);
  const graphProgressRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = storyRef.current;
    if (!section) return;

    let measurementFrame = 0;
    let animationFrame = 0;
    let scheduled = false;
    let targetProgress = 0;
    let visualProgress = 0;
    let lastAnimationTime = 0;
    const writeProgress = (next: number, graphSource = next) => {
      const filmSuction = smoothstep((next - 0.05) / 0.58);
      const globeFade = clamp((next - 0.32) / 0.18);
      const nextGraphProgress = clamp((graphSource - 0.4) / 0.6);
      const graphPhase = clamp((graphSource - 0.35) / 0.4);
      const graphReveal = clamp((graphSource - 0.39) / 0.16);

      filmRefs.current.forEach((film, index) => {
        if (!film) return;
        if (reducedMotion) {
          film.style.removeProperty("--card-pull");
          film.style.removeProperty("--card-arc");
          film.style.removeProperty("opacity");
          return;
        }
        const pullConfig = filmPulls[index] ?? filmPulls[0];
        const pull = clamp((filmSuction - pullConfig.delay) * pullConfig.gain);
        film.style.setProperty("--card-pull", pull.toFixed(4));
        film.style.setProperty("--card-arc", (pull * (1 - pull)).toFixed(4));
      });

      section.style.setProperty("--story-progress", String(next));
      section.style.setProperty("--film-suction", String(filmSuction));
      section.style.setProperty("--globe-fade", String(globeFade));
      section.style.setProperty("--graph-progress", String(nextGraphProgress));
      section.style.setProperty("--graph-phase", String(graphPhase));
      section.style.setProperty("--graph-reveal", String(graphReveal));

      if (Math.abs(graphProgressRef.current - nextGraphProgress) >= 0.012 || nextGraphProgress === 0 || nextGraphProgress === 1) {
        graphProgressRef.current = nextGraphProgress;
        setGraphProgress(nextGraphProgress);
      }
    };
    const animate = (time: number) => {
      const elapsed = lastAnimationTime ? Math.min(0.05, (time - lastAnimationTime) / 1000) : 1 / 60;
      lastAnimationTime = time;
      const step = 1 - Math.exp(-elapsed / 0.18);
      visualProgress += (targetProgress - visualProgress) * step;
      if (Math.abs(targetProgress - visualProgress) < 0.0008) {
        visualProgress = targetProgress;
        writeProgress(visualProgress, targetProgress);
        animationFrame = 0;
        lastAnimationTime = 0;
        return;
      }
      writeProgress(visualProgress, targetProgress);
      animationFrame = window.requestAnimationFrame(animate);
    };
    const scheduleAnimation = () => {
      if (animationFrame === 0) animationFrame = window.requestAnimationFrame(animate);
    };
    writeProgress(reducedMotion ? 1 : 0);
    if (reducedMotion) return;

    const update = () => {
      scheduled = false;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      targetProgress = clamp((window.scrollY - sectionTop) / travel);
      writeProgress(visualProgress, targetProgress);
      scheduleAnimation();
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      measurementFrame = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(section);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(measurementFrame);
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => filmStage.current?.querySelectorAll("video").forEach((video) => {
      if (preference.matches) video.pause();
      else void video.play().catch(() => {});
    });
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  const graphVisible = graphProgress > 0.01;
  const actionVisible = graphProgress > 0.92;

  return <div className="landing landing-editorial landing-with-story">
    <main>
      <section
        className={`${styles.narrative} ${reducedMotion ? styles.reduced : ""}`}
        ref={storyRef}
        id="agent-story"
        aria-label="RØGUE signal story"
      >
        <div className={styles.sticky}>
          <div className={`hero hero-editorial hero-video-stage ${styles.stage}`} ref={filmStage} aria-label="Sports archive flowing into a forecast">
            {graphVisible ? (
              <div className={styles.graphShaderLayer} aria-hidden="true">
                <ShaderBackground className={styles.shaderBackground} />
              </div>
            ) : (
              <div className={styles.shaderLayer} aria-hidden="true">
                <ShaderBackground className={styles.shaderBackground} />
              </div>
            )}
            <div className={`hero-copy hero-copy-center landing-globe-copy ${styles.heroCopy}`}>
              <h1 data-text="Agentic betting">Agentic <em>betting</em></h1>
              <div className={styles.globeWrap}>
                <GlobeCdn className="landing-globe-cdn" speed={0.0045} />
              </div>
              <span className="hero-demo-note">SIMULATION ONLY / VIRTUAL CREDITS / NO REAL-MONEY EXECUTION</span>
            </div>

            <figure ref={(node) => { filmRefs.current[0] = node; }} className={`sports-film sports-film-football ${styles.film} ${styles.filmFootball}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-football" />
              <video {...videoProps} preload="metadata" onError={markFilmFailed} onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }} src="https://videos.pexels.com/video-files/32102515/13685679_1920_1080_30fps.mp4" />
            </div><figcaption><span>FOOTBALL</span></figcaption></figure>
            <figure ref={(node) => { filmRefs.current[1] = node; }} className={`sports-film sports-film-basketball ${styles.film} ${styles.filmBasketball}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-basketball" />
              <video {...videoProps} preload="auto" onError={markFilmFailed} src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Domen%20Lorbek%20to%20Brezec%20-%20Slovenia%20vs%20Poland.webm" />
            </div><figcaption><span>BASKETBALL</span></figcaption></figure>
            <figure ref={(node) => { filmRefs.current[2] = node; }} className={`sports-film sports-film-soccer ${styles.film} ${styles.filmSoccer}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-soccer" />
              <video {...videoProps} preload="auto" title="Rafael Leão scores for AC Milan" onError={markFilmFailed} onLoadedMetadata={(event) => { event.currentTarget.currentTime = 0.55; }} onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 3.1) event.currentTarget.currentTime = 0.55; }} src="https://upload.wikimedia.org/wikipedia/commons/6/69/Goal_by_Rafael_Leao.webm" />
            </div><figcaption><span>SOCCER</span></figcaption></figure>
            <figure ref={(node) => { filmRefs.current[3] = node; }} className={`sports-film sports-film-hockey ${styles.film} ${styles.filmHockey}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-hockey" />
              <video {...videoProps} preload="auto" title="Connor McDavid scores against Guelph in 2015" onError={markFilmFailed}>
                <source src="https://upload.wikimedia.org/wikipedia/commons/5/5b/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm" type="video/webm" />
                <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5b/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm.360p.mpeg4.mov" type="video/quicktime" />
              </video>
            </div><figcaption><span>HOCKEY</span></figcaption></figure>

            <div className={`${styles.graphLayer} ${graphVisible ? styles.graphVisible : ""}`} aria-hidden={!graphVisible}>
              <GraphStoryPanel
                sample={sample}
                progress={graphProgress}
                phaseProgress={graphProgress}
                reducedMotion={reducedMotion}
                embedded
                onTryDemo={() => router.push("/onboarding")}
                actionVisible={actionVisible}
              />
            </div>
            <div className={styles.scrollCue} aria-hidden="true">SCROLL TO FOLLOW THE SIGNAL <span>↓</span></div>
          </div>
        </div>
      </section>
    </main>
  </div>;
}
