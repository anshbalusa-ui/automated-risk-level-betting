"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AgenticOrb from "./AgenticOrb";
import { defaultPreferences, runAgent } from "@/lib/agent";
import GraphStory from "./GraphStory";

// Fixed-date demo values are independent of a visitor's persisted run.
const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));
const videoProps = { autoPlay: true, muted: true, loop: true, playsInline: true, controls: false, disablePictureInPicture: true, disableRemotePlayback: true, controlsList: "nodownload noplaybackrate noremoteplayback" };

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
            <AgenticOrb onTryDemo={() => router.push("/onboarding")} />
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
