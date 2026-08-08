# Felix Finance — dev shortcuts
.PHONY: up dev down build restart logs logs-all psql \
        backfill catchup backfill-status

# ── Stack ────────────────────────────────────────────────────────────────────

# Start db + backend + frontend (nginx, port 80) + pgAdmin (port 5050)
up:
	docker compose up -d db backend frontend pgadmin

# Start db + backend only (use alongside `make dev` for hot-reload frontend)
backend:
	docker compose up -d db backend pgadmin

# Start frontend dev server with hot reload (requires backend already running)
dev:
	cd frontend && npm start

# Build images and start everything
build:
	docker compose up -d --build db backend frontend pgadmin

down:
	docker compose down

restart:
	docker compose restart backend

# ── Logs ─────────────────────────────────────────────────────────────────────

logs:
	docker compose logs -f backend

logs-all:
	docker compose logs -f

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

# Show last trade_date per ticker
backfill-status:
	docker compose exec db psql -U felix -d felix -c "\
	SELECT ticker, MAX(trade_date) AS last_date \
	FROM price_history WHERE exchange_code='BRVM' \
	GROUP BY ticker ORDER BY last_date ASC, ticker;"
