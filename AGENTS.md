# Engineering contract

- Simulation only: credits, never money or real-world execution. Label all seeded records DEMO DATA.
- Forecast every outcome numerically; policy evaluates a candidate, never an opaque LLM answer. No LLM-generated measurements, probabilities, or results.
- Candidate bands: low [0.60, 1], medium [0.40, 0.60), high [0.15, 0.40), very_high [0, 0.15) abstains. Selected band only, not cumulative.
- Allocation of *virtual available credits*: low 1–3%, medium 3–5%, high 5–10%. No contradictory same-event positions.
- Providers normalize events, forecasts, references; policy must remain domain-neutral. Keep reference probability optional and identify source.
- Capture immutable pre-event forecast/policy/allocation snapshots. Add resolution without rewriting the original snapshot. Historical demo fixtures must have pre-event timestamps.
- Browser demo persistence is private per browser. Database migrations describe authenticated production storage; never ship a shared privileged client token.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`. Run after integrating changes.
- Work on `codex/mvp-v1`; verify before committing, merge into main and push only when remote permission exists. Never commit secrets; `.env.local` ignored.

## Historical sports analytics research (v2)

- Follow `docs/HISTORICAL_ANALYTICS_V2.md` for the next backend-focused coding pass. It is a research-only plan, not a wagering system.
- Preserve the live GitHub Pages static demo. Do not replace bundled demo fixtures with unvalidated real data.
- Use historical publicly permitted sports data for retrospective analysis, with attribution, source timestamps, schema validation, and no look-ahead leakage.
- Do not build gambling integrations, upcoming-match betting selections, automated wagers, odds comparisons, or real-money flows.
- Train/evaluate only on historical partitions; make no accuracy or certainty claims without measured held-out evidence. Prefer an honest `insufficient data` state.
- Keep existing MANTIC visual theme, globe and layout intact. Only small, additive UI changes when required; backend and tests are the priority.
- Require reproducible tests, documented data provenance, frozen model/version metadata, and clear verified vs unverified status. Never invent passing test results.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
