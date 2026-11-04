# MANTIC — historical sports analytics research v2

Status: architectural plan, not an implemented or validated production ML backend.

## Scope and product boundary

Develop an optional **offline educational sports analytics** research package. It studies historical match outcomes with real, properly licensed data, reports retrospective model evaluation, and may export static summaries for the existing MANTIC demo. It must **not** output actionable wagering recommendations, betting odds edges, stake sizes, automated placements, or real-money activity. The browser demo remains simulation-only and works without any research package or external API.

## Current architecture that must be preserved

- GitHub Pages serves Next.js static export using `GITHUB_PAGES=true` in `next.config.ts`. No always-on Python API, Next API route, job scheduler, or database server is deployed there.
- `src/lib/fixtures.ts`: deliberately synthetic event/forecast/reference/resolution datasets.
- `src/lib/domain.ts`: TypeScript contracts. `src/lib/agent.ts`: evaluation orchestration. `src/lib/policy.ts`: validation and rule gates. `src/lib/simulation.ts`: virtual credits only. `src/lib/analytics.ts`: observed historical demo metrics.
- `src/lib/storage.ts` and `src/components/AgentProvider.tsx`: private local browser persistence and simulation state.
- `supabase/migrations/` is an optional database schema, not evidence of a connected runtime backend.
- Preserve the existing MANTIC branding, hero globe, typography, navigation, mobile layout, component APIs, and synthetic demo behavior.

## Architecture proposal, implement incrementally

```text
research/
  pyproject.toml
  README.md
  src/mantic_research/
    schemas.py
    providers/
      base.py
      historical_sports.py
    ingest.py
    normalize.py
    validate.py
    features.py
    splits.py
    baselines.py
    evaluate.py
    reports.py
    provenance.py
    cli.py
  tests/
    test_schemas.py
    test_ingest.py
    test_leakage.py
    test_splits.py
    test_baselines.py
    test_metrics.py
    test_reproducibility.py
  data/
    .gitkeep
docs/
  DATA_SOURCES.md
  RESEARCH_MODEL_CARD.md
  RESEARCH_VALIDATION.md
  RELEASE_CHECKLIST.md
```

This is a suggested target, not a requirement to create empty scaffolding. Use the smallest cohesive set of modules that yields genuine tested functionality.

## Data source discovery

Start with one sport and one legally usable historical match dataset, explicitly documenting what the dataset covers and does not cover. Candidate sources to review:

- Cricsheet: https://cricsheet.org/matches/ — historical cricket match records, ODC Attribution for JSON/CSV; https://cricsheet.org/format/json/ explains schemas. Verify license, attribution and available coverage before use.
- StatsBomb open data: https://github.com/hudl/open-data — selected historical football competitions; the publisher requests source attribution and use of its logo when publishing research. Check conditions before redistribution.
- nflverse: https://github.com/nflverse/nflverse-data — historical NFL releases, with per-dataset licensing; attribution and restrictions vary by release. Avoid treating all releases as identically licensed.

Do not download the entire universe immediately. Implement a small deterministic research fixture and, where permitted, a bounded real historical sample with explicit checksums and source URLs. Do not commit copyrighted or otherwise prohibited redistributable datasets.

## Data contracts

Normalized historical records need: source ID, source version, competition, season, source match ID, stable participant identifiers, event start time (UTC), final score, status, as-of/capture timestamp, source URL/license, and ingestion timestamp. Reject ambiguous IDs, duplicates, conflicting results, cancelled matches, invalid dates or missing labels. Keep raw evidence immutable; transformations are derived artifacts. Do not silently impute missing values that alter outcomes.

Document feature timing and ensure an input would have been available prior to the historical event when doing retrospective pre-event research. Prevent target leakage from postgame metrics, future standings, future rosters and data corrections.

## Research model (historical retrospective only)

Create a transparent baseline before considering anything more complex. Fit with a chronological train/validation/test split and a frozen latest historical holdout. Use only safe, pre-event historical features with recorded availability. Compare against a constant-rate or simple team-history baseline. Evaluate out-of-sample sample counts, log loss/Brier score, calibration, class imbalance, data coverage and subgroup drift. Distinguish classification hit rate from probability quality. Any confidence/uncertainty claims require explicit statistical validation. Never claim perfection, guaranteed results, or real-world betting performance.

Model artifacts should record training dataset checksum, training window, feature definitions, code revision, random seed, metric definitions, software versions, and known weaknesses. If coverage or sample size is inadequate, report 'insufficient data' rather than generating strong conclusions.

## Optional export to current UI

Prefer static, versioned JSON historical-research reports generated offline, without a new required backend deployment. Display clearly labeled historical research results if a UI integration is useful; never treat retrospective evaluation as current forecasts. Preserve the bundled synthetic flow as the no-network fallback. Restrict UI work to one or two additive elements. Do not restyle, rename or replace the site.

## Tests and acceptance

- Unit tests: schemas, validation, duplicates, missingness, timestamp ordering, provenance and license metadata, deterministic normalization, metrics and edge cases.
- Research tests: chronological split isolation, future-feature leakage prevention, corrupted/empty inputs, repeated run determinism, holdout frozen, impossibly strong performance warning.
- Contract tests: exported research JSON shape, version consistency, no demo source mislabeling, graceful fallback when reports are absent.
- Existing project: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`.
- Research package: document environment setup, run tests, training/evaluation commands and offline sample modes; execute them and report **actual** results, never invented passes.
- CI: add independent research job without disrupting the Pages deploy. Never commit secrets, caches, large raw datasets, or model artifacts with unclear redistribution rights.
- Write `docs/RESEARCH_VALIDATION.md` with test commands, command outputs, measured metrics, sample counts, limitations and remaining blockers. State explicitly when live data access is unavailable.

## Codex implementation sequence

1. Audit existing repo and capture baseline test results, including failures and environmental blockers.
2. Add initial normalized historical data contract, one permitted historical provider, and provenance/quality checks.
3. Add a small reproducible retrospective baseline and leakage-safe chronological evaluation.
4. Add automated research + export contract tests and documentation.
5. Optionally add a single small historical research summary surface, preserving the entire visual theme.
6. Re-run all feasible tests and builds, inspect diffs and commit only verified changes.

Definition of done: reproducible historical research, explicit provenance and limitations, unchanged functional demo, measurable tests, no misleading accuracy claims, and **no wagering features**.
