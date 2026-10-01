# 90-second walkthrough

Open `/`, choose **Try the demo** (no signup). The defaults target Sports + Weather, NBA/Warriors + San Francisco, Medium [40%,60%), Auto-Simulate and 1,000 virtual credits. The dashboard activity counters derive from evaluated fixture candidates. Open an NBA result, then a weather result; inspect the model/reference probability gap. Open an abstention: band matching alone does not override uncertainty. Visit Portfolio for reserved virtual credits, History for decisions/resolutions, Performance for Brier/calibration and all-vs-included comparison. All examples are labeled DEMO DATA and cannot place a real-world position.

Use onboarding to change categories, interests, risk band and mode. Review only surfaces decisions; Auto-Simulate creates virtual positions. Personal configuration and snapshots persist only in the current browser. Stored upcoming synthetic events settle after their snapshotted resolution time when the browser next opens or remains open; these labels are not observations.

## Reproduce production demo locally

```bash
npm ci
npm run build
npm run test:e2e
```

Playwright launches the **production build** on `127.0.0.1:3099` if no server is already running, and exercises desktop and phone journeys, including corrupt browser storage recovery. For manual inspection, use `npm run start -- --hostname 127.0.0.1 --port 3099` after building and open `http://127.0.0.1:3099`.
