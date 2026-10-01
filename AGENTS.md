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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
