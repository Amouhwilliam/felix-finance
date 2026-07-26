"""
Scraping orchestrator — runs every 3 minutes during BRVM trading hours.
Uses APScheduler for the cron, writes to PostgreSQL via sync psycopg2.
"""
import logging
from datetime import datetime, timezone

import psycopg2
from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from providers.sikafinance import SikafinanceScraper
from providers.brvm_official import BRVMOfficialProvider

logger = logging.getLogger(__name__)

_primary = SikafinanceScraper(request_delay=1.2)
_fallback = BRVMOfficialProvider()


def _get_conn():
    # psycopg2 needs plain postgresql:// — strip the SQLAlchemy dialect prefix
    url = settings.sync_database_url.replace("postgresql+psycopg2://", "postgresql://")
    return psycopg2.connect(url)


def upsert_quotes(quotes) -> None:
    if not quotes:
        return
    now = datetime.now(timezone.utc)
    with _get_conn() as conn:
        with conn.cursor() as cur:
            for q in quotes:
                # Upsert latest quote
                cur.execute(
                    """
                    INSERT INTO quotes (ticker, exchange_code, price, open, high, low, prev_close,
                        change_pct, volume, volume_xof, scraped_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker, exchange_code) DO UPDATE SET
                        price        = EXCLUDED.price,
                        open         = EXCLUDED.open,
                        high         = EXCLUDED.high,
                        low          = EXCLUDED.low,
                        prev_close   = EXCLUDED.prev_close,
                        change_pct   = EXCLUDED.change_pct,
                        volume       = EXCLUDED.volume,
                        volume_xof   = EXCLUDED.volume_xof,
                        scraped_at   = EXCLUDED.scraped_at
                    """,
                    (
                        q.ticker, q.exchange_code, q.price, q.open, q.high, q.low,
                        q.prev_close, q.change_pct, q.volume, q.volume_xof, now,
                    ),
                )
                # Insert intraday snapshot (only during market hours)
                cur.execute(
                    """
                    INSERT INTO intraday_snapshots (ticker, exchange_code, price, change_pct, volume, ts)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (q.ticker, q.exchange_code, q.price, q.change_pct, q.volume, now),
                )
            # Purge intraday snapshots older than 7 days
            cur.execute(
                "DELETE FROM intraday_snapshots WHERE ts < NOW() - INTERVAL '7 days'"
            )
        conn.commit()
    logger.info("Upserted %d quotes at %s", len(quotes), now.isoformat())


def scrape_job() -> None:
    """Main scrape job — called by APScheduler."""
    if not _primary.is_market_open():
        logger.debug("Market closed — skipping scrape")
        return

    logger.info("Scraping BRVM quotes …")
    quotes = _primary.fetch_all_quotes()
    if not quotes:
        logger.warning("Primary scraper returned 0 quotes — trying fallback")
        quotes = _fallback.fetch_all_quotes()

    try:
        upsert_quotes(quotes)
    except Exception as e:
        logger.error("DB write failed: %s", e)


def upsert_history(points) -> None:
    """Insert daily OHLCV rows, skip duplicates."""
    if not points:
        return
    with _get_conn() as conn:
        with conn.cursor() as cur:
            for p in points:
                cur.execute(
                    """
                    INSERT INTO price_history
                        (ticker, exchange_code, trade_date, open, high, low, close, volume, volume_xof)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ticker, exchange_code, trade_date) DO NOTHING
                    """,
                    (
                        p.ticker, p.exchange_code, p.trade_date,
                        p.open, p.high, p.low, p.close, p.volume, p.volume_xof,
                    ),
                )
        conn.commit()
    logger.info("Inserted %d history rows", len(points))


def eod_job() -> None:
    """
    End-of-day job (runs at 15:10 GMT Mon–Fri).
    Adds today's close as a new candle in price_history.
    """
    logger.info("Running EOD history job …")
    quotes = _primary.fetch_all_quotes()
    if not quotes:
        return
    from providers.base import HistoryPoint
    from datetime import date
    today = date.today()
    points = [
        HistoryPoint(
            ticker=q.ticker, exchange_code=q.exchange_code, trade_date=today,
            open=q.open, high=q.high, low=q.low, close=q.price,
            volume=q.volume, volume_xof=q.volume_xof,
        )
        for q in quotes
    ]
    upsert_history(points)


def start_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        scrape_job,
        trigger="interval",
        minutes=settings.scrape_interval_minutes,
        id="scrape_quotes",
    )
    # EOD job — Mon–Fri at 15:10 UTC
    scheduler.add_job(
        eod_job,
        trigger="cron",
        day_of_week="mon-fri",
        hour=15,
        minute=10,
        id="eod_history",
    )
    scheduler.start()
    logger.info("Scheduler started (interval=%d min)", settings.scrape_interval_minutes)
    return scheduler
