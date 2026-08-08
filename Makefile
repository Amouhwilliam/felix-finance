# Felix Finance — dev shortcuts
# Usage: make <target>

.PHONY: up down build restart logs logs-all shell-backend shell-db \
        backfill catchup backfill-status psql

# ── Stack ────────────────────────────────────────────────────────────────────

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up -d --build

restart:
	docker compose restart backend

# ── Logs ─────────────────────────────────────────────────────────────────────

logs:
	docker compose logs -f backend

logs-all:
	docker compose logs -f

# ── Shells ───────────────────────────────────────────────────────────────────

shell-backend:
	docker compose exec backend sh

shell-db:
	docker compose exec db sh

# ── Database ─────────────────────────────────────────────────────────────────

psql:
	docker compose exec db psql -U felix -d felix

# ── Backfill ─────────────────────────────────────────────────────────────────

# Full 5-year backfill — run once after first deploy (~90 min)
backfill:
	docker compose exec backend python backfill.py

# Quick catch-up after downtime — last 2 months only (~3 min)
catchup:
	docker compose exec backend python backfill.py --months 2

# Check which tickers are up to date
backfill-status:
	docker compose exec db psql -U felix -d felix -c "\
	SELECT ticker, MAX(trade_date) AS last_date \
	FROM price_history WHERE exchange_code='BRVM' \
	GROUP BY ticker ORDER BY last_date ASC, ticker;"
