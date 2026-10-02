# Fieldnote — Automated Risk-Level Forecasting Agent

A personalized decision agent for **simulation only**. Pick sports and weather interests, choose a probability-based risk level, and let one pipeline forecast **every** event outcome, filter candidates for evidence quality, abstain when necessary, and optionally reserve virtual credits. No accounts, API keys, payments, real-world wagering or model-generated-by-LLM probabilities.

## Core idea

`preferences → events → outcome forecasts → candidates → evidence policy → include/abstain → virtual positions → resolution → evaluation`. Forecasting supplies probabilities; policy decides whether each candidate fits a *specific* user's selected band. Sports and weather share the same normalized event and candidate types. The demo runs offline from deterministic synthetic fixtures, labeled **DEMO DATA** throughout.

## Risk bands

| Profile | Candidate outcome probability | Virtual allocation from available credits |
| --- | --- | --- |
| Low | 60%–100% | 1%–3% |
| Medium | 40%–<60% | 3%–5% |
| High | 15%–<40% | 5%–10% |

81%–100% is strong Low, not a fourth profile. Below 15%, including 0%, is classified internally as very high risk and **abstained** in V1. High targets its own band, not all less risky bands. Probability values must be finite and in [0,1]; a binary forecast must sum to one within 0.001. A band match is necessary but insufficient for inclusion.

## Probability vs uncertainty

Probability concerns a particular outcome. Uncertainty measures how reliable that estimate is on a normalized 0–1 scale (0 is least uncertain). Demo uncertainty is an illustrative deterministic approximation, **not** a statistically validated confidence interval. The policy also checks source quality, capture freshness, calibration evidence and reference validity. A high-uncertainty 54% forecast can be abstained even for Medium.

## Probability gap

`model probability − reference probability` in percentage points. A positive gap is a useful signal, not a promised advantage. References in the shipped demo are **synthetic baseline fixtures**, never real market odds. If a trustworthy reference is unavailable, the UI shows unavailable, and policy applies stronger evidence requirements without fabricating one.

## Virtual portfolio

Review mode evaluates without reserving credits. Auto-Simulate reserves an authorized fraction of currently available **virtual credits**, rejects duplicate or contradictory same-event positions, and settles historical positions against synthetic resolutions. Stored upcoming demo events resolve with predetermined synthetic labels only after their snapshotted resolution time, on the next open or while the browser remains open; there is no background server scheduler. Settlement uses the stored reference probability as an illustrative credit-return convention, not real-world odds or stake advice. Historical probability, uncertainty, gap, decision, model/policy versions, and allocation are retained rather than overwritten by the result.

## Architecture

- `src/lib/domain.ts`: shared normalized contracts.
- `src/lib/fixtures.ts`: deterministic NBA + weather providers and fictional historic labels.
- `src/lib/policy.ts`: validation, risk classification, candidate construction, evidence gates.
- `src/lib/simulation.ts`: allocation, position snapshots, virtual settlement.
- `src/lib/agent.ts`: discovery/filter/evaluation/position orchestration.
- `src/lib/analytics.ts`: resolved-only Brier score, calibration buckets, all-vs-included performance.
- `src/app/**`: landing, onboarding, dashboard, forecast detail, portfolio, history, performance.
- `supabase/migrations/**`: optional authenticated schema; no unsafe public write access.

More detail: [architecture](docs/ARCHITECTURE.md), [data provenance](docs/DATA.md), [modeling](docs/MODELING.md), [demo walkthrough](docs/DEMO.md), [execution](docs/BUILD_PLAN.md).

## Demo

Open the [public demo](https://anshbalusa-ui.github.io/automated-risk-level-betting/) and click **Explore the demo**. Defaults: NBA/Warriors and San Francisco weather, Medium risk, Auto-Simulate, 1,000 virtual credits. Inspect two domains, a deliberate abstention, resolved history, portfolio and measured performance. No signup. User preferences/run snapshot persist per browser in localStorage; clearing browser data clears them. There is no shared server storage in no-login demo mode.

## Local development

Node.js 20.9+ and npm required. In a terminal on your own computer:

```bash
git clone https://github.com/anshbalusa-ui/automated-risk-level-betting.git
cd automated-risk-level-betting
npm ci
npm run dev
```

Open the `Local:` URL printed by Next.js (usually `http://localhost:3000`) while `npm run dev` is still running. `localhost` is **your computer**, not a hosted demo; for a browser-only demo use the public link above. If the terminal says `node: command not found` or `npm: command not found`, install Node.js 20.9+ first. No environment variables are needed for deterministic demo mode; see `.env.example`. Never expose a Supabase service-role key in the client. The SQL migration anticipates a future authenticated server path; the public demo deliberately does not write shared user records.

## Testing

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

The unit suite checks probability boundaries, policies, virtual allocation, candidate/reference behavior, Brier/calibration, due-event settlement and the integrated demo. `npm run test:e2e` launches the **production build** at `http://127.0.0.1:3099` when needed and exercises desktop and phone browser journeys, including invalid stored-ledger recovery. Synthetic resolved fixtures only demonstrate calculation plumbing; they do **not** constitute measured accuracy against real-world observations.

## Limitations and future work

No external NBA/weather providers are enabled: live data requires validated terms, timestamps, rate limits and robust caching. No statistical NBA model has been trained; a future Python logistic baseline requires strict chronological training/validation/test split and leakage audit. Calibration with synthetic data has no predictive validity. Future authenticated persistence may use the Supabase migration with user-scoped access; current demo storage remains local. No LLM or real-money execution is required or supplied.

## Deployment status

The public demo is deployed from `main` to [GitHub Pages](https://anshbalusa-ui.github.io/automated-risk-level-betting/) by `.github/workflows/deploy-pages.yml`. `GITHUB_PAGES=true` enables the static export with its repository subpath and pregenerates every synthetic forecast detail route; the ordinary local and production Next builds keep their root paths. The public site uses per-browser localStorage only, so there is no hosted account or server-side scheduler.

## Redesigned interface and deployment

The interface uses near-black surfaces, restrained borders, a single light accent, and type-led hierarchy in `src/app/globals.css`. The landing preview uses a deterministic fixture or the current browser run; it never presents a demo estimate as live data. Fixture titles omit their repeated prefix in the workspace, where the demo disclosure remains visible in the context bar. Overview, Forecasts and Portfolio stay in the primary navigation; **More** exposes History and Performance on desktop and mobile. Step 4 of onboarding mounts `src/components/ui/ai-thiking-orb-and-input.tsx`: edit comma-separated interests, start a local run, watch the dotted scan rotate in place, then inspect that run's counts before opening the workspace. An existing run is never presented as a new submission. Reduced-motion preferences skip the transition.

Forecast rows retain model probability, reference, gap, risk band, uncertainty, and policy decision at every viewport. History links decisions to virtual allocations or “No position”; portfolio and history become labeled cards on small screens. Performance compares only resolved demo outcomes and keeps metric definitions behind an expandable note. All simulation state remains local to the browser; no Supabase connection or new service is required.

The application uses TypeScript and Tailwind CSS 4. There is no `index.css` in this Next.js App Router project; global styles belong in `src/app/globals.css`. Landing and onboarding actions use the shared `.button` styles; the previously supplied `Button`, `LiquidButton`, and `MetalButton` remain available in `src/components/ui/liquid-glass-button.tsx` but are not used for the primary flow. `components.json` maps shadcn's aliases to `src/components/ui` and the existing stylesheet, so additions can use `npx shadcn@latest add <component>` without reinitializing the project. The `@/*` alias points at `src/*`.

For Vercel, import the repository as a standard Next.js project with the repository root as the root directory and the default build command (`npm run build`). No environment variables or secrets are required for this local deterministic demo. The default build uses root routes, including `/forecast/[id]`; the existing GitHub Pages export remains behind `GITHUB_PAGES=true` and its repository subpath. Deploy a preview from the redesign branch and check both a new-browser demo and a direct forecast-detail URL before promoting production.
