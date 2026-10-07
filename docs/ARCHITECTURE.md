# Architecture

`ForecastEvent` → domain-independent deterministic provider → `ForecastResult` (one probability for every possible outcome) → `Candidate` per outcome → independent policy decision → optional virtual position → event resolution → performance aggregation. NBA and weather fixtures use exactly the same pipeline.

Forecasts and references are separate. A reference is an external/benchmark expectation for the *same outcome*; probability gap = model − reference. It is an indicator, not a guarantee. Missing reference stays missing and requires stronger evidence. Uncertainty is an explicit normalized demo approximation rather than a confidence interval. The policy interface accepts calibration error, but fixtures use a disclosed fixed illustrative input (0.1), **not** a calibrated real model or evidence from future outcomes. Historical resolved labels are used only for after-the-fact analytics; production calibration gating requires a chronologically prior validated sample.

The dashboard renders an `AgentRun` snapshot. Demo runs persist per browser via localStorage, not shared between visitors; fixture data are synthetic and visibly labeled. Storage migrations live in `supabase/migrations` for an authenticated future backend. No unauthenticated shared database writes, payment accounts, real-world placements, or mandatory external API keys.

Simulation reserves a bounded fraction of available credits for each included candidate. Duplicate/contradictory same-event positions are rejected. Settlements add deterministic virtual credit returns; active allocations remain reserved. The original forecast, evidence, versions and policy reason remain unchanged after resolution.

Provider failures in the shipped demo cannot affect the pipeline because fixtures are bundled locally. External providers are intentionally not enabled until terms, rate limits, credentials and validity can be verified. The product does not depend on an LLM.
