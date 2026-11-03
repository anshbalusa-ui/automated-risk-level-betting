# Mantic — YC demo walkthrough

Public demo: https://anshbalusa-ui.github.io/automated-risk-level-betting/

1. From the homepage, click **Explore live demo**. This opens an NBA example directly without login or setup.
2. Review the forecast cards and open one to see predicted probabilities, evidence requirements, and why the agent includes or passes on an outcome.
3. Visit **Portfolio**, **History**, and **Performance** to see virtual positions, historical demo decisions, and illustrative analytics.
4. Choose **Customize settings** or **Edit preferences** to explore another sport and risk preference.

The demo uses clearly labeled **fictional fixtures**, **illustrative probabilities**, and **virtual credits**. It is not connected to a live sportsbook, does not use real market odds, and does not demonstrate real predictive accuracy. The backend model and live-data integrations are future work.

## Build checks

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Playwright uses the production build to test desktop and mobile journeys.
