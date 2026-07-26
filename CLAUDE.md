# Felix Finance — Agent Briefing

This file is the single source of truth for Claude Code (or any agent) picking up this project.
Read it completely before touching any file.

---

## What is Felix?

Felix is a **public-facing BRVM stock market platform** for investors in the UEMOA region.
Think Trade Republic (traderepublic.com) design language, adapted for the West African exchange.

- **No user accounts shown to visitors** — the UI is a discovery/analysis tool; sign-up CTAs appear in sidebars
- **47 official BRVM stocks** with real tickers, sectors, logos
- **Real prices scraped from Sikafinance** every 3 minutes during trading hours (Mon–Fri 09:00–15:00 GMT)
- **Charts from 1 day to 5 years** using intraday snapshots + daily OHLCV history
- **Extensible to new exchanges** (NSE Nigeria, GSE Ghana) without changing frontend code

Owner: William Amouh (amouh74@gmail.com)

---

## Repository Layout

```
Felix-finance/
├── CLAUDE.md                   ← you are here
├── README.md
├── docker-compose.yml          ← production stack (db + backend + frontend)
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── config.py               ← pydantic-settings, reads .env
│   ├── database.py             ← SQLAlchemy async engine + session
│   ├── models.py               ← ORM: Exchange, Stock, Quote, IntradaySnapshot, PriceHistory
│   ├── schemas.py              ← Pydantic response models
│   ├── main.py                 ← FastAPI app + lifespan (table creation, seed, scheduler)
│   ├── scraper.py              ← APScheduler jobs: scrape_job (3 min) + eod_job (15:10)
│   ├── backfill.py             ← one-time 5-year history backfill script
│   └── providers/
│       ├── base.py             ← MarketDataProvider ABC + QuoteData + HistoryPoint dataclasses
│       ├── sikafinance.py      ← PRIMARY: scrapes sikafinance.com/marches/aaz (static HTML)
│       └── brvm_official.py   ← FALLBACK: scrapes brvm.org/fr/cours-actions/0 (EOD only)
└── frontend/
    ├── Dockerfile              ← multi-stage: node build → nginx serve
    ├── nginx.conf              ← SPA catch-all + /api/ proxy to backend:8000
    ├── .env                    ← REACT_APP_API_URL=http://localhost:8000 (dev)
    ├── package.json            ← react-scripts 5, TypeScript 5.9.3, React 18
    ├── tailwind.config.js
    └── src/
        ├── types.ts            ← all shared TS interfaces (Stock, StockDetail, Dividend, ...)
        ├── services/
        │   └── api.ts          ← ALL API calls go here (exchange-aware, swap-safe)
        ├── data/
        │   └── mockData.ts     ← 47 BRVM stocks mock data (used until backend is wired)
        ├── lib/
        │   ├── format.ts       ← formatFcfa, formatPct, formatCompactFcfa, pctToColor
        │   └── squarify.ts     ← treemap layout algorithm (unused in current design)
        ├── components/
        │   ├── TopNav.tsx      ← "Felix" logo + search bar + nav links + CTA buttons
        │   ├── Logo.tsx        ← loads /logos/{TICKER}.png with fallback
        │   ├── PriceChart.tsx  ← SVG line chart: dotted ref line, right Y-axis, area fill
        │   ├── StockTable.tsx  ← searchable + sortable table of all stocks
        │   ├── MarketStatBar.tsx ← 5-column aggregate stats bar
        │   ├── Dropdown.tsx    ← reusable pill dropdown
        │   └── Treemap.tsx     ← heatmap (NOT used on home page — removed per user request)
        └── pages/
            ├── Home.tsx        ← two-column: main (movers + table) + sidebar (BRVM stock list)
            ├── StockDetail.tsx ← TR-style: chart + metrics + dividends + analysts + events
            ├── Portfolio.tsx   ← auth gate (lock icon + sign-up CTA)
            ├── Watchlist.tsx   ← auth gate (lock icon + sign-up CTA)
            └── Settings.tsx    ← placeholder
```

---

## Design System

Pixel-perfect Trade Republic clone. Every value below is intentional — do not drift.

| Token | Value |
|---|---|
| Background | `#FFFFFF` |
| Primary text | `#0A0A0A` |
| Muted text | `#6B6B6B` |
| Faint text | `#A1A1A6` |
| Surface (cards/inputs) | `#F5F5F7` |
| Surface hover | `#EBEBEF` |
| Positive (green) | `#00A468` (text) / `#00D084` (fill) |
| Negative (red) | `#E23A3A` |
| Border | `rgba(0,0,0,0.06–0.09)` |
| Border radius — card | `14–16px` |
| Border radius — pill | `999px` |
| Font | Inter (Google Fonts) + system-ui fallback |
| Nav height | `60px` |
| Max shell width | `1440px` (tailwind `max-w-shell`) |
| Sidebar width | `300–320px` (right column on home + stock detail) |

**Home layout**: full-width hero → `grid-cols-[1fr_300px]` below (main + sticky right sidebar)
**StockDetail layout**: `grid-cols-12` → `col-span-8` main + `col-span-4` sidebar
**MoverCard**: `rounded-[14px] bg-[#F7F7F8]` with giant faded rank number watermark

---

## Data Architecture

### Scraping strategy (decided, implemented)

| Purpose | Source | Method | Frequency |
|---|---|---|---|
| Current prices (all 47) | `sikafinance.com/marches/aaz` | BeautifulSoup static HTML | Every 3 min during market hours |
| EOD fallback | `brvm.org/fr/cours-actions/0` | BeautifulSoup static HTML | On failure only |
| Historical 1W–5Y | `sikafinance.com/marches/download/{TICKER}.{cc}` | CSV download, 1 year per call | One-time backfill + daily at 15:10 |

**Ticker format on sikafinance**: `SNTS.sn`, `ORAC.ci`, `ETIT.tg` etc. — mapping table in `providers/sikafinance.py → TICKER_SUFFIX`

### Database schema (PostgreSQL)

```sql
exchanges     (code PK, name, country, timezone, market_open, market_close, currency)
stocks        (id, ticker, exchange_code, name, sector, sub_industry, isin, shares_outstanding, logo_url)
              UNIQUE(ticker, exchange_code)
quotes        (id, ticker, exchange_code, price, open, high, low, prev_close, change_pct,
               volume, volume_xof, scraped_at)
              UNIQUE(ticker, exchange_code) — upserted on every scrape
intraday_snapshots (id, ticker, exchange_code, price, change_pct, volume, ts)
              — every 3-min datapoint; purged after 7 days; feeds 1D chart
price_history (id, ticker, exchange_code, trade_date, open, high, low, close, volume, volume_xof)
              UNIQUE(ticker, exchange_code, trade_date) — daily candles; feeds 1W–5Y charts
```

### API endpoints (FastAPI)

```
GET  /health
GET  /v1/{exchange}/quotes                        → list[QuoteOut]
GET  /v1/{exchange}/quotes/{ticker}               → QuoteOut
GET  /v1/{exchange}/stocks                        → list[{ticker, name, sector, sub_industry}]
GET  /v1/{exchange}/stocks/{ticker}/intraday      → list[IntradayPointOut]  (1D chart)
GET  /v1/{exchange}/stocks/{ticker}/history       → list[HistoryPointOut]   (?range=1D|1W|1M|6M|1Y|5Y)
GET  /v1/{exchange}/market-stats                  → MarketStatsOut
```

Exchange is a path param so adding NSE/Nigeria tomorrow = zero frontend change.

---

## Tech Stack

### Frontend
- React 18 + TypeScript 5.9.3 (NOT 7.x — breaks react-scripts 5)
- React Router v6
- Tailwind CSS 3
- Lucide React icons
- CRA (react-scripts 5.0.1) — do NOT eject

### Backend
- Python 3.12
- FastAPI 0.115 + uvicorn
- SQLAlchemy 2 (async) + asyncpg
- psycopg2-binary (sync, for scraper writes)
- APScheduler 3 (background scheduler)
- BeautifulSoup4 + lxml (scraping)
- Pydantic v2 + pydantic-settings

### Infrastructure
- PostgreSQL 16 (Docker)
- nginx (serves React build + proxies /api/ → backend:8000)
- Docker Compose (3 services: db, backend, frontend)
- Deployment target: EC2 instance

---

## Current State — What Is Done

### Done ✅
- [x] Full TypeScript migration (TS 5.9.3)
- [x] 47 BRVM stocks with real prices, sectors, logos
- [x] Trade Republic design system (tailwind tokens, fonts, colors)
- [x] TopNav: "Felix" text logo + working search bar with dropdown + nav links
- [x] Home page: two-column, BRVM index hero + MarketStatBar + Top movers 5×2 grid with rank watermarks + StockTable + right sidebar with sorted stock list
- [x] Heatmap REMOVED (user request) — Home shows index sparkline instead
- [x] StockDetail: TR-style layout, chart with dotted ref line + Y-axis, TR metrics grid (range bars + Mkt cap/PER), dividends bars, analysts section, events cards, related stocks, sign-up CTA sidebar
- [x] PriceChart: dotted opening-price reference line, right-side Y-axis labels, colored price tag
- [x] Portfolio / Watchlist: auth gate lock screens
- [x] Backend: FastAPI app fully implemented with all endpoints
- [x] Provider pattern: `MarketDataProvider` ABC → SikafinanceScraper (primary) + BRVMOfficialProvider (fallback)
- [x] Database: all 5 tables with proper indexes and constraints
- [x] Scraper scheduler: 3-min job + EOD job at 15:10 UTC
- [x] 5-year backfill script (`backend/backfill.py`)
- [x] Docker Compose: db + backend + frontend (nginx)
- [x] Frontend service layer (`src/services/api.ts`) — all API calls in one place

### Pending 🔲 — Next tasks in priority order

1. **Wire frontend to real API** — `Home.tsx` and `StockDetail.tsx` still use `mockData.ts`.
   Replace with `api.quotes()` / `api.quote()` / `api.history()` calls.
   Pattern: fetch on mount with `useEffect`, show skeleton while loading, fall back to mock on error.

2. **Real PriceChart data** — `PriceChart.tsx` still generates seeded fake data.
   Accept `data: HistoryPoint[]` prop; when `range === '1J'` use `api.intraday()`, otherwise `api.history(range)`.

3. **Price flash animation** — when a quote updates, flash the price in green/red for 800ms.
   Add a `useRef` to detect price changes and apply a CSS class.

4. **Working search** — TopNav search currently filters mockData client-side.
   Once backend is live, replace with `api.quotes()` cached in context.

5. **Polling** — Add `setInterval` 30s refresh on Home page to re-fetch quotes.

6. **Functional auth gates** — Portfolio and Watchlist show lock screens. Wire the CTA buttons to a modal or `/login` route.

7. **Settings page** — currently a placeholder. Add theme toggle (light only for now), language (FR), about section.

8. **Error boundaries** — wrap pages in React error boundaries so a failed API call doesn't crash the whole app.

9. **Historical backfill** — after first EC2 deploy: `docker compose exec backend python backfill.py`

10. **EC2 deployment** — see deployment section below.

---

## How to Run Locally

### Frontend only (mock data, no backend needed)
```bash
cd frontend
npm install
npm start        # http://localhost:3000
```

### Full stack with Docker
```bash
# From project root
docker compose up -d --build

# First time only — backfill 5 years of history
docker compose exec backend python backfill.py

# Logs
docker compose logs -f backend
```

### Backend only (for development)
```bash
cd backend
pip install -r requirements.txt
# You need a local postgres running:
export DATABASE_URL=postgresql+asyncpg://felix:felix@localhost:5432/felix
export SYNC_DATABASE_URL=postgresql+psycopg2://felix:felix@localhost:5432/felix
uvicorn main:app --reload --port 8000
```

---

## Deployment on EC2

```bash
# 1. SSH into EC2 instance
ssh -i your-key.pem ec2-user@<EC2_IP>

# 2. Install Docker + Docker Compose
sudo yum install -y docker
sudo service docker start
sudo usermod -aG docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone repo
git clone <repo-url> && cd Felix-finance

# 4. Set CORS in docker-compose.yml to your domain
# Edit: CORS_ORIGINS: '["https://yourapp.com"]'

# 5. Deploy
docker compose up -d --build

# 6. One-time backfill (run in background, takes ~10 min)
docker compose exec -d backend python backfill.py

# 7. Open port 80 in EC2 security group
```

For HTTPS, put an nginx/Caddy reverse proxy or AWS ALB in front.

---

## Key Decisions Already Made (do not relitigate)

| Decision | Reason |
|---|---|
| Sikafinance as primary scraper | Static HTML, no auth, one page = all 47 stocks, no anti-scraping |
| brvm.org as EOD fallback | Official source, static HTML, good cross-check |
| VisionBoursiere eliminated | JS SPA + login required |
| RichBourse kept as backup only | JS-rendered history page needs Playwright |
| TypeScript 5.9.3 (not 7.x) | react-scripts 5 uses old `resolve` pkg that can't find TS 7's exports-only package.json |
| Provider/adapter pattern | Tomorrow we add NSE Nigeria → just create `providers/nse.py`, zero frontend change |
| Composite PK `(ticker, exchange_code)` | Enables multi-exchange in same DB from day 1 |
| 7-day intraday retention | ~120 rows per stock per day × 47 stocks × 7 days = ~40k rows — tiny |
| APScheduler (not Celery) | No Redis needed, simpler Docker setup, sufficient for 3-min interval |
| Treemap/heatmap removed from Home | User request — "just show the graph" |
| "Felix" text logo | User request — "just Felix" |

---

## Important Constraints

- **Do NOT install TypeScript 7.x** — breaks react-scripts. Pin at `^5`.
- **Do NOT eject CRA** — use CRACO or react-scripts overrides if config changes needed.
- **Do NOT add auth features to the visitor UI** — lock screens only, CTA buttons open modal.
- **All API calls must go through `src/services/api.ts`** — never fetch directly in components.
- **Exchange code is always UPPERCASE** (`"BRVM"`, not `"brvm"`).
- **FCFA prices** — use `formatFcfa()` from `lib/format.ts`, never hardcode currency symbols.
- **Logo files** live in `public/logos/{TICKER}.png` — 48 files confirmed present.
- **Tailwind custom classes** — see `tailwind.config.js`. Don't use raw hex colors in JSX when a token exists.

---

## File-by-File Quick Reference

| File | What it does | Last changed |
|---|---|---|
| `backend/main.py` | FastAPI app, all routes, lifespan (seed + scheduler) | Session 90 |
| `backend/scraper.py` | APScheduler jobs, upsert_quotes(), upsert_history(), eod_job() | Session 90 |
| `backend/providers/sikafinance.py` | Scrape /marches/aaz, download CSV history | Session 90 |
| `backend/models.py` | SQLAlchemy models for all 5 tables | Session 90 |
| `frontend/src/services/api.ts` | All API calls: quotes, history, intraday, stats | Session 90 |
| `frontend/src/pages/Home.tsx` | Two-column home, top movers, sidebar stock list | Session 90 |
| `frontend/src/pages/StockDetail.tsx` | TR-style stock detail page | Session 90 |
| `frontend/src/components/TopNav.tsx` | "Felix" text logo + search + nav | Session 90 |
| `frontend/src/components/PriceChart.tsx` | SVG chart with ref line + Y-axis | Session 90 |
| `frontend/src/data/mockData.ts` | 47 BRVM stocks — used until API is wired | Unchanged |
| `docker-compose.yml` | 3-service production stack | Session 90 |
