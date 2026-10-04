"use client";

import { useRouter } from "next/navigation";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";
import { defaultPreferences, runAgent } from "@/lib/agent";
import GraphStory from "./GraphStory";

// Fixed-date demo values are independent of a visitor's persisted run.
const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));

export default function LandingExperience() {
  const router = useRouter();

  return <div className="landing landing-editorial landing-with-story">
    <main>
      <section className="hero hero-editorial">
        <div className="hero-video-stage" aria-label="Sports archive">
          <div className="hero-copy hero-copy-center landing-globe-copy">
            <span className="landing-globe-kicker">FIELDNOTE / SIGNAL ROUTING</span>
            <h1><span>READ THE</span><em>NUMBERS.</em></h1>
            <p>Choose what matters, set your tolerance, and let the agent filter weak evidence before it acts.</p>
            <GlobeCdn className="landing-globe-cdn" />
            <div className="hero-actions">
              <button className="landing-globe-cta" type="button" onClick={() => router.push("/onboarding")}>
                Try demo <span aria-hidden="true">↗</span>
              </button>
            </div>
            <span className="hero-demo-note">SIMULATION ONLY · VIRTUAL CREDITS · NO REAL-MONEY EXECUTION</span>
          </div>
          <figure className="sports-film sports-film-football"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-football" aria-hidden="true" />
          </div><figcaption><span>FOOTBALL</span></figcaption></figure>
          <figure className="sports-film sports-film-basketball"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-basketball" aria-hidden="true" />
          </div><figcaption><span>BASKETBALL</span></figcaption></figure>
          <figure className="sports-film sports-film-soccer"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-soccer" aria-hidden="true" />
          </div><figcaption><span>SOCCER</span></figcaption></figure>
          <figure className="sports-film sports-film-hockey"><div className="sports-film-media">
            <div className="sports-film-fallback sports-film-fallback-hockey" aria-hidden="true" />
          </div><figcaption><span>HOCKEY</span></figcaption></figure>
        </div>
      </section>
      <GraphStory sample={sample} />
    </main>
  </div>;
}
