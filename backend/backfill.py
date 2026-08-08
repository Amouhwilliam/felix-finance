"""
Historical backfill script — fetches OHLCV data from Sikafinance for all 47 BRVM stocks.

Usage:
  # Full 5-year backfill (first deploy, ~90 min)
  docker compose exec backend python backfill.py

  # Catch-up after downtime — last 2 months only (~3 min)
  docker compose exec backend python backfill.py --months 2
  docker compose exec -d backend python backfill.py --months 2   # background

  # Specific tickers only
  docker compose exec backend python backfill.py --tickers SNTS,ETIT,BOAC --months 2
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

SEPARATOR = "─" * 60


def parse_args():
    parser = argparse.ArgumentParser(description="BRVM price history backfill")
    parser.add_argument(
        "--months", type=int, default=None,
        help="Months to fetch per ticker (default: 60 = 5 years). Use 2–3 for a catch-up.",
    )
    parser.add_argument(
        "--tickers", type=str, default=None,
        help="Comma-separated tickers to backfill (default: all 47).",
    )
    return parser.parse_args()


def fmt_elapsed(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.0f}s"
    return f"{seconds / 60:.1f}min"


def main():
    args = parse_args()
    months = args.months or 60

    tickers = ALL_TICKERS
    if args.tickers:
        tickers = [t.strip().upper() for t in args.tickers.split(",")]
        unknown = [t for t in tickers if t not in TICKER_SUFFIX]
        if unknown:
            logger.error("Unknown tickers: %s. Valid: %s", unknown, sorted(TICKER_SUFFIX))
            sys.exit(1)

    n = len(tickers)
    est_min = math.ceil(n * months * 1.5 / 60)

    logger.info(SEPARATOR)
    logger.info("BACKFILL  START")
    logger.info("  tickers : %d  (%s)", n, ", ".join(tickers) if n <= 10 else f"{tickers[:5]}…")
    logger.info("  window  : %d months (%.1f years) per ticker", months, months / 12)
    logger.info("  estimate: ~%d–%d min", est_min, est_min * 2)
    logger.info(SEPARATOR)

    scraper = SikafinanceScraper(request_delay=1.0)
    total_rows = 0
    failed: list[str] = []
    run_start = time.perf_counter()

    for i, ticker in enumerate(tickers, 1):
        pct = (i - 1) / n * 100
        elapsed_run = time.perf_counter() - run_start
        eta = (elapsed_run / (i - 1) * (n - i + 1)) if i > 1 else 0

        logger.info(
            "[%d/%d] %-8s  %.0f%% done%s",
            i, n, ticker, pct,
            f"  —  ETA ~{fmt_elapsed(eta)}" if i > 1 else "",
        )

        t0 = time.perf_counter()
        try:
            points = scraper.backfill_stock(ticker, months=months)
            ticker_elapsed = time.perf_counter() - t0

            if points:
                upsert_history(points)
                total_rows += len(points)
                logger.info(
                    "  ✔ %-8s  %d rows  (%.1fs)",
                    ticker, len(points), ticker_elapsed,
                )
            else:
                logger.warning("  ✘ %-8s  0 rows — download may have failed (%.1fs)", ticker, ticker_elapsed)
                failed.append(ticker)

        except Exception as e:
            logger.error("  ✘ %-8s  ERROR: %s", ticker, e)
            failed.append(ticker)

        if i < n:
            time.sleep(1.5)

    total_elapsed = time.perf_counter() - run_start
    succeeded = n - len(failed)

    logger.info(SEPARATOR)
    logger.info("BACKFILL  COMPLETE")
    logger.info("  duration  : %s", fmt_elapsed(total_elapsed))
    logger.info("  rows added: %d", total_rows)
    logger.info("  succeeded : %d / %d tickers", succeeded, n)
    if failed:
        logger.warning("  failed    : %s", ", ".join(failed))
    else:
        logger.info("  failed    : none")
    logger.info(SEPARATOR)


if __name__ == "__main__":
    main()
