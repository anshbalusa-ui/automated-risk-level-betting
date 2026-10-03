"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/AgentProvider";
import { defaultPreferences, runAgent } from "@/lib/agent";
import GraphStory from "./GraphStory";
import styles from "./LandingExperience.module.css";

// A fixed-date sample keeps the public preview stable across server render and hydration.
// A visitor's persisted run is never replaced by this example.
const sample = runAgent(defaultPreferences, new Date("2026-10-02T12:00:00Z"));
const featured = sample.evaluated.filter((entry) =>
  entry.event.metadata.historical !== true && entry.candidate.outcome === "Yes" &&
  (entry.event.id === "demo-nba-warriors-close" || entry.event.id === "demo-nba-warriors-uncertain"),
);
const videoProps = { autoPlay: true, muted: true, loop: true, playsInline: true, controls: false, disablePictureInPicture: true, disableRemotePlayback: true };
const films = [
  { label: "FOOTBALL", url: "https://videos.pexels.com/video-files/32102515/13685679_1920_1080_30fps.mp4" },
  { label: "BASKETBALL", url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Domen%20Lorbek%20to%20Brezec%20-%20Slovenia%20vs%20Poland.webm" },
  { label: "SOCCER", url: "https://commons.wikimedia.org/wiki/Special:Redirect/file/2022%20FIFA%20World%20Cup%27s%20first%20goal%20by%20Enner%20Valencia%20of%20Ecuador%20against%20Qatar.webm" },
] as const;
const bands = [
  { name: "High", range: "15–39%", detail: "More uncertainty. Evidence still has to pass." },
  { name: "Medium", range: "40–59%", detail: "A narrower view of the middle probability band." },
  { name: "Low", range: "60–100%", detail: "Higher model confidence. Never a guarantee." },
] as const;

function FilmStrip() {
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => strip.current?.querySelectorAll("video").forEach((video) => {
      if (preference.matches) video.pause();
      else void video.play().catch(() => {});
    });
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return <div ref={strip} className={styles.filmStrip} aria-label="Sports footage: football, basketball, soccer, and hockey">
    {films.map((film) => <figure className={styles.film} key={film.label}>
      <video {...videoProps} preload="metadata" aria-hidden="true" src={film.url} />
      <figcaption>{film.label}</figcaption>
    </figure>)}
    <figure className={styles.film}>
      <video {...videoProps} preload="metadata" aria-hidden="true">
        <source src="https://upload.wikimedia.org/wikipedia/commons/5/5b/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm" type="video/webm" />
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5b/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm/McDavid_2nd_Goal_2-25-15_%28Highlight_Reel%29.webm.360p.mpeg4.mov" type="video/quicktime" />
      </video>
      <figcaption>HOCKEY</figcaption>
    </figure>
  </div>;
}

function ProductReveal({ hasRun }: { hasRun: boolean }) {
  return <section className={styles.product} id="product" aria-labelledby="product-heading">
    <div className={styles.productHead}>
      <span className={styles.kicker}>04 / THE PRODUCT</span>
      <h2 id="product-heading">The decision is the product.</h2>
      <p>Same risk band. Different evidence. Different policy decisions.</p>
    </div>
    <div className={styles.workspace}>
      <div className={styles.workspaceBar}><span className={styles.wordmark}>RØGUE <span>/ FORECASTS</span></span><span>DEMO DATA · MEDIUM RISK · SIMULATION ONLY</span></div>
      <div className={styles.workspaceBody}>
        <div className={styles.workspaceTop}><div><span>AGENT OUTPUT / SPORTS</span><h3>What made the cut.</h3></div><span>{sample.activity.included} INCLUDED · {sample.activity.abstained} ABSTAINED</span></div>
        {featured.map((entry) => {
          const allocation = sample.positions.find((position) => position.candidateId === entry.candidate.id)?.virtualAllocation;
          const reference = entry.reference?.probability;
          return <article className={styles.forecast} key={entry.candidate.id}>
            <div className={styles.forecastName}><span>NBA / {entry.candidate.outcome.toUpperCase()} OUTCOME</span><strong>{entry.event.title.replace(/^DEMO DATA: /, "")}</strong><small>{entry.decision.reason}</small></div>
            <div className={styles.forecastNumber}><span>MODEL</span><strong>{Math.round(entry.candidate.probability * 100)}%</strong></div>
            <div className={styles.forecastMeta}><span>REFERENCE</span><strong>{reference === undefined ? "—" : `${Math.round(reference * 100)}%`}</strong><small>{reference === undefined ? "No reference" : `+${Math.round((entry.candidate.probability - reference) * 100)} pts gap`}</small></div>
            <div className={styles.forecastResult}><span>POLICY</span><strong data-decision={entry.decision.decision}>{entry.decision.decision === "include" ? "INCLUDED" : "ABSTAINED"}</strong><small>{allocation === undefined ? "No position" : `${allocation.toFixed(1)} virtual credits allocated`}</small></div>
          </article>;
        })}
      </div>
    </div>
    <Link href={hasRun ? "/dashboard" : "/onboarding"} className={styles.productLink}>{hasRun ? "Open your workspace" : "Start your demo"}<span aria-hidden="true">↗</span></Link>
  </section>;
}

export default function LandingExperience() {
  const { run } = useAgent();
  const [navSolid, setNavSolid] = useState(false);
  const [risk, setRisk] = useState<(typeof bands)[number]["name"]>("Medium");
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNavSolid(!entry.isIntersecting), { threshold: 0.1 });
    const hero = heroRef.current;
    if (hero) observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  function moveLight(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch" || !heroRef.current) return;
    const box = heroRef.current.getBoundingClientRect();
    heroRef.current.style.setProperty("--pointer-x", `${((event.clientX - box.left) / box.width) * 100}%`);
    heroRef.current.style.setProperty("--pointer-y", `${((event.clientY - box.top) / box.height) * 100}%`);
  }
  const destination = run ? "/dashboard" : "/onboarding";
  return <div className={styles.landing} id="top">
    <nav className={`${styles.nav} ${navSolid ? styles.navSolid : ""}`} aria-label="Landing navigation">
      <Link className={styles.logo} href="/" aria-label="RØGUE home"><span className={styles.logoMark} aria-hidden="true">Ø</span> RØGUE</Link>
      <div className={styles.navLinks}><a href="#signal-story">The signal</a><a href="#product">Product</a><a href="#how-it-works">How it works</a></div>
      <Link className={styles.navLaunch} href={destination}>{run ? "Dashboard" : "Try demo"}<span aria-hidden="true">↗</span></Link>
    </nav>
    <main>
      <section className={styles.hero} ref={heroRef} onPointerMove={moveLight} aria-labelledby="landing-heading">
        <div className={styles.heroLight} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><span className={styles.signalDot} /> SPORTS INTELLIGENCE / SIMULATION ONLY</div>
          <h1 id="landing-heading">Make every prediction <em>earn its place.</em></h1>
          <p>Choose your sports and risk. RØGUE finds the signal, rejects weak evidence, and shows you why.</p>
          <div className={styles.heroActions}><Link className={styles.primary} href={destination}>{run ? "Open RØGUE" : "Try RØGUE"}<span aria-hidden="true">↗</span></Link><a className={styles.secondary} href="#signal-story">Explore the signal <span aria-hidden="true">↓</span></a></div>
        </div>
        <div className={styles.heroFooter}><span>DEMO DATA · VIRTUAL CREDITS · NO REAL TRANSACTIONS</span><span>SCROLL TO FOLLOW THE SIGNAL ↓</span></div>
        <FilmStrip />
      </section>
      <GraphStory sample={sample} />
      <ProductReveal hasRun={!!run} />
      <section className={styles.how} id="how-it-works" aria-labelledby="how-heading">
        <div><span className={styles.kicker}>05 / YOUR PARAMETERS</span><h2 id="how-heading">Your risk changes what gets through.</h2><p>Select a band to see how the agent filters demo outcomes. Matching the band is only the first check; uncertainty and evidence can still make it abstain.</p></div>
        <div className={styles.howControl}><div className={styles.bandChoices} role="group" aria-label="Preview risk bands">{bands.map((band) => <button type="button" key={band.name} aria-pressed={risk === band.name} onClick={() => setRisk(band.name)}><span>{band.name}</span><strong>{band.range}</strong></button>)}</div><p aria-live="polite"><strong>{risk} risk.</strong> {bands.find((band) => band.name === risk)?.detail}</p><span>PREVIEW ONLY · CONFIGURE YOUR OWN RUN IN THE DEMO</span></div>
      </section>
      <section className={styles.final} aria-labelledby="final-heading"><span className={styles.kicker}>THE SIGNAL IS YOURS TO EXPLORE</span><h2 id="final-heading">Set your risk.<br /><em>See what survives.</em></h2><Link className={styles.primary} href={destination}>{run ? "Open your workspace" : "Launch the demo"}<span aria-hidden="true">↗</span></Link><small>SIMULATION ONLY · NO SIGNUP · VIRTUAL CREDITS</small></section>
    </main>
  </div>;
}
