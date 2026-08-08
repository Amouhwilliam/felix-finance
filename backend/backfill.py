"""
Historical backfill script — fetches OHLCV data from Sikafinance for all 47 BRVM stocks.

Usage:
  # Full 5-year backfill (first deploy, ~90 min)
  docker compose exec backend python backfill.py

  # Catch-up after downtime — only fetch recent N months (~2 min for 2 months)
  docker compose exec backend python backfill.py --months 2
  docker compose exec -d backend python backfill.py --months 2   # background

  # Specific tickers only
  docker compose exec backend python backfill.py --tickers SNTS,ETIT,BOAC
"""
import argparse
import logging
import math
import sys
import time

from scraper import upsert_history
from providers.sikafinance import SikafinanceScraper, TICKER_SUFFIX

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

ALL_TICKERS = list(TICKER_SUFFIX.keys())


def parse_args():
    parser = argparse.ArgumentParser(description="BRVM price history backfill")
    parser.add_argument(
        "--months", type=int, default=None,
        help="Number of months to fetch (default: 60 = 5 years). Use 1-3 for a quick catch-up.",
    )
    parser.add_argument(
        "--tickers", type=str, default=None,
        help="Comma-separated list of tickers to backfill (default: all 47).",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    months = args.months or 60

    tickers = ALL_TICKERS
    if args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",")]
        unknown = [t for t in tickers if t not in TICKER_SUFFIX]
        if unknown:
            logger.error("Unknown tickers: %s", unknown)
            sys.exit(1)

    logger.info(
        "Backfill START — %d tickers, %d months (%.1f years) each",
        len(tickers), months, months / 12,
    )
    estimated_min = math.ceil(len(tickers) * months * 1.5 / 60)
    logger.info("Estimated time: ~%d–%d min", estimated_min, estimated_min * 2)

    scraper = SikafinanceScraper(request_delay=1.0)
    total = 0
    failed = []

    for i, ticker in enumerate(tickers, 1):
        logger.info("[%d/%d] Backfilling %s …", i, len(tickers), ticker)
        try:
            points = scraper.backfill_stock(ticker, months=months)
            if points:
                upsert_history(points)
                total += len(points)
                logger.info("  → %d rows inserted", len(points))
            else:
                logger.warning("  → 0 rows for %s (download may have failed)", ticker)
                failed.append(ticker)
        except Exception as e:
            logger.error("  → Error for %s: %s", ticker, e)
            failed.append(ticker)
        if i < len(tickers):
            time.sleep(1.5)

    logger.info("Backfill DONE — %d total rows. Failed: %s", total, failed or "none")


if __name__ == "__main__":
    main()
