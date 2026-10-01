# Modeling

V1 proves the pipeline with disclosed deterministic probabilities, not a trained NBA model. Synthetic fixtures are not suitable for claims of predictive skill. Binary outcome probabilities must be finite, in [0,1], and sum to one within the documented tolerance. Brier score for a candidate is `(probability - observed)^2`. Calibration compares observed frequency with predicted probability in non-overlapping bins and displays sample counts; empty bins report no observed value.

A future Python logistic-regression baseline should train only on past games, validate on later games and reserve the latest chronological segment as untouched test. Every feature and reference needs an as-of timestamp before tipoff. Report baseline comparison, sample sizes, calibration and leakage audit before enabling it; adding a fake unvalidated model now would weaken the demo.
