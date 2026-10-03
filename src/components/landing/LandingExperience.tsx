"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAgent } from "@/components/AgentProvider";
import { defaultPreferences } from "@/lib/agent";
import { GraphStory } from "./GraphStory";
import styles from "./LandingExperience.module.css";

export function LandingExperience() {
  const { run, startAgent } = useAgent();
  const router = useRouter();

  function tryDemo() {
    startAgent({
      ...defaultPreferences,
      categories: [...defaultPreferences.categories],
      interests: [...defaultPreferences.interests],
    });
    router.push("/dashboard");
  }

  return (
    <div className={styles.landing}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand} aria-label="RØGUE home">
          <span className={styles.brandMark}>R</span>
          <span className={styles.brandName}>RØGUE<small>FORECAST STUDIO</small></span>
        </Link>
        <nav className={styles.navLinks} aria-label="Landing navigation">
          <Link href="/dashboard">Workspace</Link>
          <Link href="/performance">Methodology</Link>
        </nav>
        <button type="button" className={styles.navAction} onClick={tryDemo}>
          {run ? "New demo" : "Try demo"}<span>↗</span>
        </button>
      </header>
      <main>
        <GraphStory onTryDemo={tryDemo} />
      </main>
      <footer className={styles.footer}>
        <span>RØGUE / FORECAST STUDIO</span>
        <span>DEMO DATA · SIMULATION ONLY</span>
      </footer>
    </div>
  );
}
