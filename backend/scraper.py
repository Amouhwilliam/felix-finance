"""
Scraping orchestrator — runs every 3 minutes during BRVM trading hours.
Uses APScheduler for the cron, writes to PostgreSQL via sync psycopg2.
"""
import logging
import time
from datetime import datetime, timedelta, timezone

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
    t0 = time.perf_counter()

    # Log each quote at DEBUG level before writing
    logger.debug("DB  writing %d quotes to postgres …", len(quotes))
    for q in quotes:
        sign = "▲" if (q.change_pct or 0) >= 0 else "▼"
        logger.debug(
            "DB  %-8s  %s %9.0f FCFA  (%+.2f%%)  vol=%s",
            q.ticker, sign, q.price, q.change_pct or 0,
            f"{q.volume:,}" if q.volume else "—",
        )

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
                # Insert intraday snapshot
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

    elapsed = time.perf_counter() - t0
    logger.info(
        "DB  upserted %d quotes + %d intraday snapshots in %.2fs  [%s]",
        len(quotes), len(quotes), elapsed, now.strftime("%H:%M:%S UTC"),
    )


def scrape_job() -> None:
    """Main scrape job — called by APScheduler."""
    from datetime import datetime, timezone
    now_utc = datetime.now(timezone.utc)

    if not _primary.is_market_open():
        logger.debug("SCRAPER  market closed (%s UTC) — skipping", now_utc.strftime("%H:%M %a"))
        return

    t0 = time.perf_counter()
    logger.info("━" * 60)
    logger.info("SCRAPER  ▶ cycle start  %s UTC", now_utc.strftime("%Y-%m-%d %H:%M:%S"))

    quotes = _primary.fetch_all_quotes()
    if not quotes:
        logger.warning("SCRAPER  primary returned 0 quotes — trying BRVM official fallback")
        quotes = _fallback.fetch_all_quotes()
        if quotes:
            logger.info("SCRAPER  fallback returned %d quotes", len(quotes))
        else:
            logger.error("SCRAPER  both scrapers returned 0 quotes — aborting cycle")
            return

    try:
        upsert_quotes(quotes)
    except Exception as e:
        logger.error("SCRAPER  DB write failed: %s", e, exc_info=True)
        return

    elapsed = time.perf_counter() - t0
    gainers = [q for q in quotes if (q.change_pct or 0) > 0]
    losers  = [q for q in quotes if (q.change_pct or 0) < 0]
    flat    = [q for q in quotes if (q.change_pct or 0) == 0]
    logger.info(
        "SCRAPER  ■ cycle done   %d quotes  ▲%d ▼%d =%d  in %.1fs",
        len(quotes), len(gainers), len(losers), len(flat), elapsed,
    )
    logger.info("━" * 60)


def upsert_history(points) -> None:
    """Insert daily OHLCV rows, skip duplicates."""
    if not points:
        return
    t0 = time.perf_counter()
    with _get_conn() as conn:
        with conn.cursor() as cur:
            for p in points:
                logger.debug(
                    "DB  HIST  %-8s  %s  open=%7.0f  high=%7.0f  low=%7.0f  close=%7.0f  vol=%s",
                    p.ticker, p.trade_date, p.open or 0, p.high or 0, p.low or 0, p.close,
                    f"{p.volume:,}" if p.volume else "—",
                )
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
    logger.info("DB  inserted %d history rows in %.2fs", len(points), time.perf_counter() - t0)


def eod_job() -> None:
    """
    End-of-day job (runs at 15:10 GMT Mon–Fri).
    Adds today's close as a new candle in price_history.
    """
    from datetime import datetime, timezone
    logger.info("━" * 60)
    logger.info("EOD JOB  ▶ start  %s UTC", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    quotes = _primary.fetch_all_quotes()
    if not quotes:
        logger.error("EOD JOB  primary scraper returned 0 quotes — aborting")
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
    logger.info("EOD JOB  ■ done  %d candles written for %s", len(points), today.isoformat())
    logger.info("━" * 60)


def ai_insights_job() -> None:
    """
    Weekly job — generates AI insights for all BRVM stocks and caches them in DB.
    Runs Sunday at 06:00 UTC so insights are fresh for Monday market open.
    Only runs if AI_ENABLED=true in config.
    """
    if not settings.ai_enabled:
        logger.debug("AI insights disabled — skipping weekly job")
        return

    from ai.bedrock import BedrockProvider
    from ai.openai_provider import OpenAIProvider
    from ai.base import StockContext
    from datetime import timezone

    if settings.ai_provider == "openai":
        provider = OpenAIProvider(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
    else:
        provider = BedrockProvider(
            model_id=settings.bedrock_model_id,
            region=settings.aws_region,
        )

    logger.info("AI insights job starting with provider=%s", provider.provider_name)

    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT q.ticker, q.exchange_code, q.price, q.change_pct, q.high, q.low, "
                "s.name, s.sector FROM quotes q JOIN stocks s "
                "ON q.ticker=s.ticker AND q.exchange_code=s.exchange_code"
            )
            rows = cur.fetchall()

    now = datetime.now(timezone.utc)
    valid_until = now + timedelta(days=settings.ai_insight_cache_days)

    for ticker, exchange, price, change_pct, high, low, name, sector in rows:
        ctx = StockContext(
            ticker=ticker, name=name or ticker, sector=sector or "",
            exchange=exchange, current_price=price or 0,
            change_pct_today=change_pct or 0,
            change_pct_1m=None, change_pct_1y=None,
            price_52w_high=high, price_52w_low=low,
            volume_avg=None,
        )
        try:
            result = provider.generate_insight(ctx)
            with _get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO ai_insights
                            (ticker, exchange_code, sentiment, insight_text, insight_text_en,
                             buy_pct, hold_pct, sell_pct, provider, generated_at, valid_until)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (ticker, exchange_code) DO UPDATE SET
                            sentiment       = EXCLUDED.sentiment,
                            insight_text    = EXCLUDED.insight_text,
                            insight_text_en = EXCLUDED.insight_text_en,
                            buy_pct         = EXCLUDED.buy_pct,
                            hold_pct        = EXCLUDED.hold_pct,
                            sell_pct        = EXCLUDED.sell_pct,
                            provider        = EXCLUDED.provider,
                            generated_at    = EXCLUDED.generated_at,
                            valid_until     = EXCLUDED.valid_until
                        """,
                        (
                            ticker, exchange, result.sentiment, result.insight_text,
                            result.insight_text_en,
                            result.buy_pct, result.hold_pct, result.sell_pct,
                            provider.provider_name, now, valid_until,
                        ),
                    )
                conn.commit()
            logger.info("AI insight saved for %s (sentiment=%s)", ticker, result.sentiment)
        except Exception as e:
            logger.error("AI insight failed for %s: %s", ticker, e)

    logger.info("AI insights job complete for %d stocks", len(rows))


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
    # AI insights — every Sunday at 06:00 UTC (if enabled)
    scheduler.add_job(
        ai_insights_job,
        trigger="cron",
        day_of_week="sun",
        hour=6,
        minute=0,
        id="ai_insights_weekly",
    )
    scheduler.start()
    logger.info("Scheduler started (interval=%d min)", settings.scrape_interval_minutes)
    return scheduler
