# Lighthouse audit: NFT home and detail

Audit run on 2026-11-02 against the optimized Vite demo build with the default MSW mock scenario. Each page/profile combination was measured three times using a fresh browser profile; the table reports medians. Full HTML and JSON artifacts, run-level metrics, and the audit configuration are in this directory.

## Median scores and metrics

| Page | Profile | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | Mobile | 80 | 95 | 100 | 92 | 4080 | 0 | 301 |
| Home | Desktop | 99 | 97 | 100 | 92 | 934 | 0.0002 | 5 |
| NFT detail | Mobile | 80 | 96 | 100 | 92 | 4037 | 0 | 317 |
| NFT detail | Desktop | 99 | 97 | 100 | 92 | 900 | 0 | 0 |

Targets are Performance ≥90, Accessibility ≥95, Best Practices ≥95, and SEO ≥90. All category targets are met except mobile Performance on both pages.

## Mobile performance findings

- Home Performance is 80, up from 78 in the immediately preceding three-run audit. Median TBT decreased from 358 ms to 301 ms; median LCP is effectively unchanged (4087 ms to 4080 ms). This is a modest improvement and does not meet the 90 target.
- NFT detail Performance remains 80. Median TBT decreased from 328 ms to 317 ms, while median LCP remained 4037 ms. This does not meet the 90 target.
- The mobile runs show roughly 300 ms of TBT. Lighthouse identifies about 104 KiB of unused JavaScript, primarily in the mock-service-worker bundle and application entry bundle. The demo build intentionally includes MSW because the required default-mock scenario is under audit.
- Lighthouse reports that the LCP image request is not discoverable in the initial HTML. Its URL is available only after the client starts and receives mock API data, so the image begins loading after navigation. In the mobile run reports, the LCP resource-load delay is about 322 ms on home and 419 ms on NFT detail. This client-rendered, API-backed image path is the main measured LCP opportunity.
- The CSS is render-blocking; Lighthouse estimates about 150 ms savings in these mobile runs. Layout stability is already good: CLS is 0 on both mobile pages.

The current change moves home and NFT detail UI into TanStack lazy route files, while preserving the loaders, images, fonts, real page functionality, and default mock data. It modestly reduces mobile blocking time, but the initial application and mock bundles plus client-discovered LCP images remain. Reaching mobile Performance ≥90 will likely require reducing startup JavaScript and making the LCP image discoverable earlier (for example, server-rendering or otherwise providing its URL before client execution). The latter depends on the actual NFT data and must preserve the full audited page.

## Audit setup

See [audit-config.json](./audit-config.json) for the exact routes, profiles, mock scenario, tool versions, environment, and Lighthouse flags. Run-level scores and LCP/CLS/TBT are recorded in [measurements.csv](./measurements.csv), with medians in [medians.json](./medians.json). Each run has matching `.report.html` and `.report.json` files.
