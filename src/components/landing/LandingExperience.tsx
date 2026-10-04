"use client";

import { useEffect, useRef, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import SportsProbabilityGraph from "./SportsProbabilityGraph";
import { defaultPreferences, runAgent } from "@/lib/agent";
import GraphStory from "./GraphStory";

// Fixed-date demo values are independent of a visitor's persisted run.
const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));
const videoProps = { autoPlay: true, muted: true, loop: true, playsInline: true, controls: false, disablePictureInPicture: true, disableRemotePlayback: true, controlsList: "nodownload noplaybackrate noremoteplayback" };
const markFilmFailed = (event: SyntheticEvent<HTMLVideoElement>) => {
  event.currentTarget.parentElement?.classList.add("sports-film-media-failed");
};

export default function LandingExperience() {
  const router = useRouter();
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


  return <div className="landing landing-editorial landing-with-story">
    <main>
      <section className="hero hero-editorial">
        <div className="hero-video-stage" ref={filmStage} aria-label="Sports archive">
          <div className="hero-copy hero-copy-center">
            <SportsProbabilityGraph onTryDemo={() => router.push("/onboarding")} />
          </div>
          <figure className="sports-film sports-film-football"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-football" aria-hidden="true" />
            <video {...videoProps} preload="auto" aria-hidden="true" onError={markFilmFailed} onTimeUpdate={(event) => { if (event.currentTarget.currentTime >= 11.5) event.currentTarget.currentTime = 0; }} src="https://videos.pexels.com/video-files/34396408/14571476_1920_1080_24fps.mp4" />
          </div><figcaption><span>FOOTBALL</span></figcaption></figure>
          <figure className="sports-film sports-film-basketball"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-basketball" aria-hidden="true" />
            <video {...videoProps} preload="auto" aria-hidden="true" onError={markFilmFailed} src="https://videos.pexels.com/video-files/31955038/13615488_2560_1440_24fps.mp4" />
          </div><figcaption><span>BASKETBALL</span></figcaption></figure>
          <figure className="sports-film sports-film-soccer"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-soccer" aria-hidden="true" />
            <video {...videoProps} preload="auto" aria-hidden="true" onError={markFilmFailed} src="https://videos.pexels.com/video-files/33831187/14358055_2560_1440_24fps.mp4" />
          </div><figcaption><span>SOCCER</span></figcaption></figure>
          <figure className="sports-film sports-film-hockey"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-hockey" aria-hidden="true" />
            <video {...videoProps} preload="auto" aria-hidden="true" onError={markFilmFailed} src="https://videos.pexels.com/video-files/6340278/6340278-uhd_2560_1440_25fps.mp4" />
          </div><figcaption><span>HOCKEY</span></figcaption></figure>
        </div>
      </section>
      <GraphStory sample={sample} />
    </main>
  </div>;
}
