"use client";

import { useEffect, useRef } from "react";
import AgenticOrb from "./AgenticOrb";
import { defaultPreferences, runAgent } from "@/lib/agent";
import GraphStory from "./GraphStory";

// Fixed-date demo values are independent of a visitor's persisted run.
const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));
const videoProps = { autoPlay: true, muted: true, loop: true, playsInline: true, controls: false, disablePictureInPicture: true, disableRemotePlayback: true, controlsList: "nodownload noplaybackrate noremoteplayback" };

export default function LandingExperience() {
  const filmStage = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    const stage = filmStage.current;
    if (!stage) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (motionPreference.matches || !finePointer.matches) return;

    let targetX = 0.5;
    let targetY = 0.5;
    let cursorX = 0.5;
    let cursorY = 0.5;
    let trailX = 0.5;
    let trailY = 0.5;
    let animationFrame: number | null = null;

    const render = () => {
      animationFrame = null;
      cursorX += (targetX - cursorX) * 0.2;
      cursorY += (targetY - cursorY) * 0.2;
      trailX += (cursorX - trailX) * 0.08;
      trailY += (cursorY - trailY) * 0.08;
      stage.style.setProperty("--landing-cursor-x", `${cursorX * 100}%`);
      stage.style.setProperty("--landing-cursor-y", `${cursorY * 100}%`);
      stage.style.setProperty("--landing-cursor-trail-x", `${trailX * 100}%`);
      stage.style.setProperty("--landing-cursor-trail-y", `${trailY * 100}%`);
      const settled = Math.max(
        Math.abs(targetX - cursorX),
        Math.abs(targetY - cursorY),
        Math.abs(cursorX - trailX),
        Math.abs(cursorY - trailY),
      ) < 0.001;
      if (stage.classList.contains("landing-cursor-active") && !settled) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const scheduleRender = () => {
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || motionPreference.matches) return;
      const rect = stage.getBoundingClientRect();
      targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(rect.width, 1)));
      targetY = Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(rect.height, 1)));
      stage.classList.add("landing-cursor-active");
      scheduleRender();
    };

    const handlePointerLeave = () => {
      stage.classList.remove("landing-cursor-active");
    };

    const handleMotionPreference = () => {
      if (motionPreference.matches) stage.classList.remove("landing-cursor-active");
    };

    stage.addEventListener("pointermove", handlePointerMove, { passive: true });
    stage.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    motionPreference.addEventListener("change", handleMotionPreference);

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      motionPreference.removeEventListener("change", handleMotionPreference);
      stage.classList.remove("landing-cursor-active");
    };
  }, []);


  return <div className="landing landing-editorial landing-with-story">
    <main>
      <section className="hero hero-editorial">
        <div className="hero-video-stage" ref={filmStage} aria-label="Sports archive">
          <div className="landing-cursor-field" aria-hidden="true" />
          <div className="hero-copy hero-copy-center">
            <AgenticOrb />
          </div>
          <figure className="sports-film sports-film-football"><div className="sports-film-media">
            <video {...videoProps} preload="metadata" aria-hidden="true" onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 9.5) event.currentTarget.currentTime = 0; }} src="https://videos.pexels.com/video-files/32102515/13685679_1920_1080_30fps.mp4" />
          </div><figcaption><span>FOOTBALL</span></figcaption></figure>
          <figure className="sports-film sports-film-basketball"><div className="sports-film-media">
            <video {...videoProps} preload="auto" aria-hidden="true" src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Domen%20Lorbek%20to%20Brezec%20-%20Slovenia%20vs%20Poland.webm" />
          </div><figcaption><span>BASKETBALL</span></figcaption></figure>
          <figure className="sports-film sports-film-soccer"><div className="sports-film-media">
            <video {...videoProps} preload="auto" aria-hidden="true" src="https://commons.wikimedia.org/wiki/Special:Redirect/file/2022%20FIFA%20World%20Cup%27s%20first%20goal%20by%20Enner%20Valencia%20of%20Ecuador%20against%20Qatar.webm" />
          </div><figcaption><span>SOCCER</span></figcaption></figure>
          <figure className="sports-film sports-film-hockey"><div className="sports-film-media">
            <video {...videoProps} preload="auto" aria-hidden="true" title="Connor McDavid scores against Guelph in 2015">
              <source src="https://upload.wikimedia.org/wikipedia/commons/5/5b/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm" type="video/webm" />
              <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5b/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm.360p.mpeg4.mov" type="video/quicktime" />
            </video>
          </div><figcaption><span>HOCKEY</span></figcaption></figure>
        </div>
      </section>
      <GraphStory sample={sample} />
    </main>
  </div>;
}
