"use client";

import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";
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

type NarrativeStyle = CSSProperties & {
  "--story-progress": number;
  "--film-suction": number;
  "--globe-fade": number;
  "--graph-progress": number;
  "--graph-phase": number;
  "--graph-reveal": number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

const markFilmFailed = (event: SyntheticEvent<HTMLVideoElement>) => {
  event.currentTarget.parentElement?.classList.add("sports-film-media-failed");
};

export default function LandingExperience() {
  const router = useRouter();
  const storyRef = useRef<HTMLElement>(null);
  const filmStage = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
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
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => setProgress(1));
      return () => window.cancelAnimationFrame(frame);
    }

    let frame = 0;
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const next = clamp((window.scrollY - sectionTop) / travel);
      setProgress((current) => Math.abs(current - next) < 0.002 ? current : next);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(section);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
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

  const filmSuction = clamp((progress - 0.08) / 0.36);
  const globeFade = clamp((progress - 0.44) / 0.2);
  const graphProgress = clamp((progress - 0.4) / 0.6);
  const graphPhase = clamp((progress - 0.35) / 0.4);
  const graphReveal = clamp((progress - 0.39) / 0.18);
  const graphVisible = graphReveal > 0.01;
  const actionVisible = graphProgress > 0.92;
  const narrativeStyle: NarrativeStyle = {
    "--story-progress": progress,
    "--film-suction": filmSuction,
    "--globe-fade": globeFade,
    "--graph-progress": graphProgress,
    "--graph-phase": graphPhase,
    "--graph-reveal": graphReveal,
  };

  return <div className="landing landing-editorial landing-with-story">
    <main>
      <section
        className={`${styles.narrative} ${reducedMotion ? styles.reduced : ""}`}
        ref={storyRef}
        id="agent-story"
        style={narrativeStyle}
        aria-label="RØGUE signal story"
      >
        <div className={styles.sticky}>
          <div className={`hero hero-editorial hero-video-stage ${styles.stage}`} ref={filmStage} aria-label="Sports archive flowing into a forecast">
            <div className={`hero-copy hero-copy-center landing-globe-copy ${styles.heroCopy}`}>
              <h1 data-text="Agentic betting">Agentic <em>betting</em></h1>
              <div className={styles.globeWrap}>
                <GlobeCdn className="landing-globe-cdn" speed={0.0045} />
              </div>
              <span className="hero-demo-note">SIMULATION ONLY · VIRTUAL CREDITS · NO REAL-MONEY EXECUTION</span>
            </div>

            <figure className={`sports-film sports-film-football ${styles.film} ${styles.filmFootball}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-football" />
              <video {...videoProps} preload="metadata" onError={markFilmFailed} onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }} src="https://videos.pexels.com/video-files/32102515/13685679_1920_1080_30fps.mp4" />
            </div><figcaption><span>FOOTBALL</span></figcaption></figure>
            <figure className={`sports-film sports-film-basketball ${styles.film} ${styles.filmBasketball}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-basketball" />
              <video {...videoProps} preload="auto" onError={markFilmFailed} src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Domen%20Lorbek%20to%20Brezec%20-%20Slovenia%20vs%20Poland.webm" />
            </div><figcaption><span>BASKETBALL</span></figcaption></figure>
            <figure className={`sports-film sports-film-soccer ${styles.film} ${styles.filmSoccer}`} aria-hidden="true"><div className="sports-film-media">
              <div className="sports-film-fallback sports-film-fallback-soccer" />
              <video {...videoProps} preload="auto" title="Rafael Leão scores for AC Milan" onError={markFilmFailed} onLoadedMetadata={(event) => { event.currentTarget.currentTime = 0.55; }} onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 3.1) event.currentTarget.currentTime = 0.55; }} src="https://upload.wikimedia.org/wikipedia/commons/6/69/Goal_by_Rafael_Leao.webm" />
            </div><figcaption><span>SOCCER</span></figcaption></figure>
            <figure className={`sports-film sports-film-hockey ${styles.film} ${styles.filmHockey}`} aria-hidden="true"><div className="sports-film-media">
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
                phaseProgress={graphPhase}
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
