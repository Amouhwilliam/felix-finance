# Felix — PRD

## Problem statement
Build a **frontend-only** mobile-first web app called **Felix** — a stock market heatmap explorer for the BRVM (Bourse Régionale des Valeurs Mobilières, West Africa's regional stock exchange). This is a UI/UX prototype only. No backend, no database, no scraper, no real integrations — hardcoded mock JSON that can be swapped for a real API later. Visual language: Trade Republic (pure black `#000000`, mint accent `#00D084`, red `#FF4D4D` for losses, flat design, SF-style sans-serif, 12–16px radii, generous whitespace).

## User choices (from ask_human)
- UI copy language: **French**
- Show **Felix** branding (in Settings header badge).

## Architecture
- React 18 + react-router-dom v6 + TailwindCSS 3, no backend logic.
- Backend `server.py` is a no-op FastAPI stub only so supervisor's `backend` program doesn't error.
- All data lives in **`/app/frontend/src/data/mockData.js`** — single source of truth, swap-out point for a future real API.
- Custom **squarified treemap** (`/app/frontend/src/lib/squarify.js`) sizes cells by `marketCapWeight` inside each sector row.
- Color scale (`/app/frontend/src/lib/format.js`) interpolates between neutral graphite and vivid mint / vivid red based on % change.

## Pages
- `/` — Heatmap (primary). Sticky top bar with history icon, period dropdown (1J/1S/1M/YTD/1A), index dropdown (BRVM Composite / 30 / Principal), refresh. Below: 7 sector rows (Télécoms → Transport) each containing a squarified treemap of tappable cells.
- `/stock/:ticker` — Detail: name, big FCFA price, abs+% change, SVG line chart (green if up, red if down), period selector, key-stats card (Capitalisation, Secteur, Ouverture, Volume, Plus haut, Plus bas), Acheter/Vendre CTA, star toggle. Bottom tab bar is hidden here for a focused view.
- `/watchlist` — Empty state ("Aucune valeur ajoutée") + mint CTA.
- `/portfolio` — Mock holdings (SNTS, SGBC, PALC) with total value, running P/L, per-row navigation to detail.
- `/settings` — Felix badge + Notifications / Devise / Langue / À propos rows.

## Personas
- Retail investor in Côte d'Ivoire / UEMOA region who wants a quick "market at a glance" on their phone.
- Designer / prospective buyer evaluating the fintech UI direction.

## Implemented (2026-01-19)
- Heatmap with 26 real BRVM tickers across 7 sectors, weighted market caps, plausible mock % changes spanning +5.24% to −4.20% for visual variety.
- Squarified treemap layout (mobile-first, scrollable).
- Trade Republic aesthetic: pure black, mint green, red, flat, hairline dividers, rounded 16px cards, tabular numerics, SF-style system stack.
- Bottom tab bar with lucide line icons, active mint tint + subtle scale-pop animation, hidden on stock detail.
- All dropdowns, refresh spin, star toggle wired up (stubbed as per brief).
- Stock detail deterministic SVG line chart from ticker+changePct seed.
- French copy throughout, FCFA formatting with thin spaces.

## Verified
- Testing agent iteration 1: **37/37 frontend checks passed (100%)**. No blocking issues.
- ESLint: clean.
- Visual QA via screenshots: mobile 430×900 for Heatmap, Stock detail, Watchlist, Portfolio, Settings.

## Backlog
### P1 (small polish)
- Guard `totalCost === 0` in Portfolio total% computation (defensive, not currently triggered).
- Silence React Router v6 future-flag warnings by adding `future={{ v7_startTransition:true, v7_relativeSplatPath:true }}` to `BrowserRouter`.

### P2 (feature ideas)
- Wire the period dropdown to a tiny mock time-series generator so the treemap actually re-computes when 1J/1S/1M is chosen.
- Search overlay (magnifier icon in top bar) that filters cells by ticker/name.
- Toggle sector view ↔ flat "top movers" list.
- Real data adapter (single `fetchStocks()` in mockData.js is the swap point).

### P3
- Localisation toggle (French ↔ English).
- Progressive Web App manifest + icon for install-to-home.

## Next tasks
- Ship as-is for user review.
- Await feedback on visual density (e.g., if user prefers the heatmap to fit one screen vs scroll) before iterating on layout parameters.
