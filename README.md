# Felix Finance

A public-facing BRVM (Bourse Régionale des Valeurs Mobilières) stock market platform for investors in the UEMOA region. Trade Republic-inspired design, real data scraped from Sikafinance.

---

## Screenshots

> Home page — BRVM index hero + top movers grid + full stock table + live sidebar

> Stock detail — TR-style chart with reference line, metrics, dividends, analysts, events

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FELIX PLATFORM                                 │
│                                                                             │
│  ┌──────────────┐     ┌───────────────────────────────────────────────┐    │
│  │   Frontend   │────▶│              FastAPI Backend                  │    │
│  │  React + TS  │     │         /v1/{exchange}/quotes                 │    │
│  │   (nginx)    │     │         /v1/{exchange}/stocks/{t}/history     │    │
│  │   Port 80    │     │         /v1/{exchange}/market-stats           │    │
│  └──────────────┘     └────────────────┬──────────────────────────────┘    │
│                                        │                                    │
│                       ┌───────────────▼──────────────┐                     │
│                       │         PostgreSQL 16          │                    │
│                       │  exchanges · stocks · quotes  │                    │
│                       │  intraday_snapshots           │                    │
│                       │  price_history (5Y OHLCV)    │                    │
│                       └───────────────────────────────┘                    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     SCRAPING LAYER (APScheduler)                   │    │
│  │                                                                     │    │
│  │  Every 3 min (market hours)    EOD 15:10 UTC (Mon–Fri)            │    │
│  │  ┌──────────────────────┐      ┌──────────────────────┐           │    │
│  │  │  SikafinanceScraper  │      │    EOD History Job   │           │    │
│  │  │  /marches/aaz        │      │  → price_history row │           │    │
│  │  │  (static HTML, all   │      │  per ticker          │           │    │
│  │  │   47 stocks)         │      └──────────────────────┘           │    │
│  │  └──────────┬───────────┘                                         │    │
│  │             │ fallback if 0 results                                │    │
│  │  ┌──────────▼───────────┐                                         │    │
│  │  │ BRVMOfficialProvider │                                         │    │
│  │  │  brvm.org (EOD only) │                                         │    │
│  │  └──────────────────────┘                                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Provider Pattern (extensible to new exchanges)

```
MarketDataProvider (ABC)
├── SikafinanceScraper     ← BRVM primary (current)
├── BRVMOfficialProvider   ← BRVM fallback (current)
├── NSEProvider            ← Nigeria (future)
└── GSEProvider            ← Ghana (future)
```

Adding a new exchange = create `providers/nse.py`, register it. Zero frontend changes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5.9.3, React Router v6, Tailwind CSS 3 |
| Icons | Lucide React |
| Build | CRA (react-scripts 5.0.1) |
| Serve | nginx (with `/api/` → backend proxy) |
| Backend | Python 3.12, FastAPI 0.115, uvicorn |
| ORM | SQLAlchemy 2 (async) + asyncpg |
| Scraping | BeautifulSoup4 + lxml + requests |
| Scheduler | APScheduler 3 (background, no Redis needed) |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |
| Deployment | AWS EC2 |

---

## Database Schema

```sql
-- Exchange registry (extensible: BRVM, NSE, GSE...)
exchanges (code PK, name, country, timezone, market_open, market_close, currency)

-- Master stock list
stocks (id, ticker, exchange_code, name, sector, sub_industry, isin, logo_url)
  UNIQUE (ticker, exchange_code)

-- Latest price snapshot — upserted every 3 min
quotes (id, ticker, exchange_code, price, open, high, low, prev_close,
        change_pct, volume, volume_xof, scraped_at)
  UNIQUE (ticker, exchange_code)

-- Intraday datapoints → 1D chart (7-day retention, auto-purged)
intraday_snapshots (id, ticker, exchange_code, price, change_pct, volume, ts)

-- Daily OHLCV candles → 1W / 1M / 3M / 1Y / 5Y charts
price_history (id, ticker, exchange_code, trade_date, open, high, low, close, volume, volume_xof)
  UNIQUE (ticker, exchange_code, trade_date)

-- AI sentiment analysis (refreshed every Sunday 06:00 UTC)
ai_insights (id, ticker, exchange_code, sentiment, insight_text, buy_pct, hold_pct, sell_pct,
             provider, generated_at, valid_until)
  UNIQUE (ticker, exchange_code)
```

---

## API Endpoints

```
GET  /health
GET  /v1/{exchange}/quotes                         all latest quotes
GET  /v1/{exchange}/quotes/{ticker}                single quote
GET  /v1/{exchange}/stocks                         stock directory
GET  /v1/{exchange}/stocks/{ticker}/intraday       1D chart (?date=YYYY-MM-DD)
GET  /v1/{exchange}/stocks/{ticker}/history        OHLCV (?range=1W|1M|3M|1Y|5Y)
GET  /v1/{exchange}/market-stats                   aggregate stats
GET  /v1/{exchange}/stocks/{ticker}/ai-insight     AI sentiment + recommendation
```

Exchange is always uppercase: `BRVM`, `NSE`, `GSE`.

---

## Data Sources

| Source | URL | Used for | Method |
|---|---|---|---|
| Sikafinance (primary) | `/marches/aaz` | All quotes every 3 min | Static HTML, BeautifulSoup |
| Sikafinance (history) | `/marches/download/{TICKER}.{cc}` | 5Y OHLCV backfill | CSV download, 1 year per call |
| BRVM Official (fallback) | `brvm.org/fr/cours-actions/0` | EOD fallback | Static HTML, BeautifulSoup |

Sikafinance data has a 15-minute delay. Quotes scraped every 3 minutes during BRVM trading hours (Mon–Fri 09:00–15:00 GMT).

---

## Project Structure

```
Felix-finance/
├── CLAUDE.md                   agent briefing document
├── README.md                   this file
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── config.py               pydantic-settings
│   ├── database.py             async SQLAlchemy engine
│   ├── models.py               ORM models
│   ├── schemas.py              Pydantic response schemas
│   ├── main.py                 FastAPI app + endpoints
│   ├── scraper.py              scheduler + upsert logic
│   ├── backfill.py             one-time 5Y history script
│   └── providers/
│       ├── base.py             MarketDataProvider ABC
│       ├── sikafinance.py      primary BRVM scraper
│       └── brvm_official.py   EOD fallback scraper
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── .env                    REACT_APP_API_URL (dev)
    ├── tailwind.config.js
    └── src/
        ├── types.ts
        ├── services/api.ts     all API calls (single source of truth)
        ├── data/mockData.ts    47 BRVM stocks (used until API wired)
        ├── lib/format.ts       formatFcfa, formatPct, pctToColor
        ├── components/
        │   ├── TopNav.tsx
        │   ├── Logo.tsx
        │   ├── PriceChart.tsx
        │   ├── StockTable.tsx
        │   ├── MarketStatBar.tsx
        │   └── Dropdown.tsx
        └── pages/
            ├── Home.tsx
            ├── StockDetail.tsx
            ├── Portfolio.tsx
            └── Watchlist.tsx
```

---

## Running Locally

### Frontend only (no backend, uses mock data)
```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

### Full stack
```bash
# Start everything (db + backend + frontend + pgAdmin)
make build        # first time (builds images)
make up           # subsequent starts

# Common shortcuts
make logs         # tail backend logs
make restart      # restart backend only
make psql         # open PostgreSQL shell
make down         # stop everything
```

Or without Make:
```bash
docker compose up -d --build
docker compose logs -f backend
```

### pgAdmin — database browser

pgAdmin is included in the stack and starts automatically with `make up`.

| Field | Value |
|---|---|
| URL | http://localhost:5050 |
| Email | `admin@felix.local` |
| Password | `felix_admin` |

Once open, add a server connection:
- **Host**: `db`
- **Port**: `5432`
- **Database**: `felix`
- **Username**: `felix`
- **Password**: `felix`

### Backfill shortcuts

```bash
make backfill        # full 5-year backfill (~90 min) — run once after first deploy
make catchup         # last 2 months only (~3 min)    — use after any downtime
make backfill-status # show last trade_date per ticker
```

### Historical backfill

The backfill script fetches up to 5 years of OHLCV data from Sikafinance for all 47 BRVM stocks.
Run it once after the first deploy, and again any time the backend has been down for several days.

```bash
# Full 5-year backfill — first deploy only (~90 min)
docker compose exec backend python backfill.py

# Quick catch-up after downtime — last 2 months only (~3 min)
docker compose exec backend python backfill.py --months 2

# Specific tickers only
docker compose exec backend python backfill.py --tickers SNTS,ETIT,BOAC

# Run in background (fire-and-forget)
docker compose exec -d backend python backfill.py --months 2
```

Check progress or confirm completion:
```bash
# Count tickers with data up to the current week
docker compose exec db psql -U felix -d felix -c "
SELECT
  SUM(CASE WHEN MAX(trade_date) >= CURRENT_DATE - 7 THEN 1 ELSE 0 END) AS up_to_date,
  SUM(CASE WHEN MAX(trade_date) < CURRENT_DATE - 7  THEN 1 ELSE 0 END) AS stale,
  COUNT(DISTINCT ticker) AS total
FROM price_history WHERE exchange_code='BRVM' GROUP BY ticker;"

# List any tickers that are still stale
docker compose exec db psql -U felix -d felix -c "
SELECT ticker, MAX(trade_date) AS last_date
FROM price_history WHERE exchange_code='BRVM'
GROUP BY ticker HAVING MAX(trade_date) < CURRENT_DATE - 7
ORDER BY ticker;"
```

> **Note:** The backfill is killed if the backend container is recreated mid-run
> (`docker compose up --build`). Always re-run it after a forced container rebuild.

---

## Deploying to EC2

```bash
# 1. Install Docker on EC2
sudo yum install -y docker
sudo service docker start
sudo usermod -aG docker ec2-user

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone and deploy
git clone <repo-url>
cd Felix-finance

# 4. Update CORS in docker-compose.yml
#    CORS_ORIGINS: '["https://yourdomain.com"]'

# 5. Start
docker compose up -d --build

# 6. Run backfill once (~10 min, 47 stocks × 5 years)
docker compose exec -d backend python backfill.py
```

Open port 80 (and 443 for HTTPS) in your EC2 Security Group.
For HTTPS, add an AWS ALB with ACM certificate in front of the EC2 instance.

---

## What's Next

1. **Price flash animation** — 800ms green/red flash when a quote updates (add `useRef` to detect changes, apply CSS class)
2. **30-second polling on Home** — `setInterval` to re-fetch `api.quotes()` and refresh movers + table
3. **Live search** — replace TopNav's mock-data filter with `api.quotes()` cached in React context
4. **Auth modal** — Portfolio/Watchlist CTA buttons open a sign-up/login modal
5. **Error boundaries** — wrap pages in React error boundaries so a failed API call doesn't crash the app
6. **EC2 deploy** — use an IAM role instead of the `~/.aws` volume mount; remove that volume from `docker-compose.yml`

---

## Design Reference

Modeled after [Trade Republic](https://traderepublic.com) with BRVM/FCFA adaptations:
- White background, black text, `#00A468` green, `#E23A3A` red
- Inter font, 60px nav, pill buttons (radius 999px), 14–16px card radius
- Two-column layout: main content (~65%) + sticky right sidebar (~35%)
- Stock detail: logo + price hero + period pills + chart + metrics grid + dividends + analysts

**Heatmap (Treemap) is NOT shown on the home page** — removed per user request. The component file (`Treemap.tsx`) is kept but not rendered.
