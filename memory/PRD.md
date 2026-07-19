# Felix — PRD

## Problem statement
Frontend-only Trade-Republic-style stock explorer for the BRVM (Bourse Régionale des Valeurs Mobilières). Home is a squarified heatmap; clicking a cell opens a rich stock page with recommendations, metrics, dividends, events, related stocks. No backend, no real data — clean mock JSON that is easy to swap for a real API later.

## User choices
- Language: **French**
- Show **Felix** wordmark in TopNav
- v2 (2026-01-19): Refactored from mobile-first dark theme → **web-responsive light theme** matching Trade Republic's web app; replaced chart on home with the square heatmap and built the full detail page (recommendations, metrics, etc.)

## Tech
- React 18 + react-router-dom v6 + TailwindCSS 3
- No backend; `/app/backend/server.py` is a stub so supervisor doesn't error
- Data lives entirely in `/app/frontend/src/data/mockData.js` (single swap-out point)
- Custom squarified treemap (`/app/frontend/src/lib/squarify.js`)
- Deterministic per-ticker synthetic details (`getStockDetail`) for metrics / dividends / analysts / events / related

## Design system (v2 — light theme)
- Background: `#FFFFFF`
- Text: black primary, `#6E6E73` secondary
- Accent (positive / CTA): mint `#00D084`, deep mint `#00A468`
- Red (negative): `#E23A3A`
- Cards: 16px radius, 1px hairline borders (`rgba(0,0,0,0.08)`), pale grey `#F5F5F7` surface
- Type: `-apple-system` SF stack, tabular numerics on prices

## Pages
- `/` **Home** — TopNav with search + Portefeuille/Liste/Réglages nav; big *Marchés* headline; period + index dropdowns; **squarified heatmap** (nested treemap on desktop, stacked sector rows on mobile); right sidebar *Investissements* (5 holdings), *Indice BRVM Composite* card; *Découvrir → Plus fortes variations du jour* + *Explorer par secteur* below.
- `/stock/:ticker` **Detail** — ticker logo, name, big FCFA price, ▲/▼ change, period pills (1J→5A), SVG chart with last-price pill, then sections **Métriques** (dual-metric grid with ranged bars), **Dividendes** (bar list), **Recommandations des analystes** (target price + Acheter/Conserver/Vendre stacked bar), **Événements à venir** (3 cards), **Valeurs à découvrir** (related cards, padded from wider universe when sector is small), **À propos**. Right sidebar: Acheter/Vendre tabs, amount input → *Vérifier l'ordre* (enables when amount > 0), **Position** card, savings-plan CTA.
- `/watchlist` — Empty state with mint CTA.
- `/portfolio` — Total value, chart, 5 holdings, sidebar *Répartition*.
- `/settings` — Felix badge + Notifications / Devise / Langue / À propos.

## Personas
- Retail investor in Côte d'Ivoire / UEMOA region who wants a market-at-a-glance view of the BRVM on web + mobile.
- Product / investor evaluating the fintech UX direction.

## Implemented (2026-01-19)
- Full v2 refactor — light theme, TopNav, responsive grid.
- Real BRVM tickers (26) across 7 sectors, plausible mock daily moves.
- Nested squarified treemap on desktop (`aspect ≈ 0.94` chosen empirically for this weight distribution); stacked sector rows on mobile (`<640px`).
- Rich stock detail with recommendations, metrics with range bars, dividends, upcoming events, related stocks, buy/sell + position sidebar.
- Deterministic per-ticker synthetic details so revisiting the same stock always shows consistent numbers.
- ESLint clean; testing agent iteration 2 = 100% pass.

## Backlog
### P1
- Wire the TopNav search to actually filter tickers by name/ticker (currently a stub).
- Slugify sector test IDs (avoid spaces/accents).

### P2
- Wire period/index dropdowns to time-shift the heatmap % values (mock timeseries).
- Add a "Top gainers / Top losers" toggle above the movers strip.
- Add a real logo palette per ticker (currently uses ticker abbrev in a circle).

### P3
- FR ↔ EN toggle.
- PWA + install-to-home.

## Next tasks
- Ship for user review; iterate on data density, related-list breadth, or sector-tile behavior once feedback comes in.
