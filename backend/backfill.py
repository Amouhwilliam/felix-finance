"""
One-time historical backfill script.
Run once after first deploy to populate price_history with up to 5 years of OHLCV.

Usage:
  docker compose exec backend python backfill.py

Or locally:
  python backfill.py
"""
import logging
import sys
import time

from scraper import upsert_history
from providers.sikafinance import SikafinanceScraper, TICKER_SUFFIX

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger(__name__)

TICKERS = list(TICKER_SUFFIX.keys())


def main():
    scraper = SikafinanceScraper(request_delay=1.0)
    total = 0
    failed = []

    for i, ticker in enumerate(TICKERS, 1):
        logger.info("[%d/%d] Backfilling %s …", i, len(TICKERS), ticker)
        try:
            points = scraper.backfill_stock(ticker, years=5)
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
        time.sleep(1.5)

    logger.info("Backfill complete: %d total rows. Failed: %s", total, failed or "none")


if __name__ == "__main__":
    main()
