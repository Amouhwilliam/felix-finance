"""
Felix Finance — FastAPI backend.

Endpoints:
  GET /v1/{exchange}/quotes                  — all latest quotes
  GET /v1/{exchange}/quotes/{ticker}         — single latest quote
  GET /v1/{exchange}/stocks/{ticker}/intraday — 1D intraday chart data
  GET /v1/{exchange}/stocks/{ticker}/history  — historical OHLCV (range param)
  GET /v1/{exchange}/market-stats             — aggregate market statistics
  GET /health                                 — health check
"""
import logging
import time as _time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone, date

from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from config import settings
from database import engine, get_db, Base
from models import Quote, IntradaySnapshot, PriceHistory, Stock, AIInsight, Exchange
from schemas import QuoteOut, HistoryPointOut, IntradayPointOut, MarketStatsOut, AIInsightOut, TopMoverOut
from scraper import start_scheduler

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)-30s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

_scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _scheduler
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent column additions for schema evolution (no Alembic needed)
        await conn.execute(text(
            "ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS insight_text_en TEXT;"
        ))
    logger.info("Database tables ensured")

    # Seed exchange and stock list on first boot
    await _seed_initial_data()

    # Start the background scraper scheduler
    if settings.scrape_enabled:
        _scheduler = start_scheduler()

    yield

    if _scheduler:
        _scheduler.shutdown(wait=False)


async def _seed_initial_data():
    """Insert BRVM exchange row and stock list on first boot if not present."""
    from database import AsyncSessionLocal
    from models import Exchange

    # BRVM stocks reference list
    BRVM_STOCKS = [
        ("SNTS", "Sonatel", "Télécoms", "Opérateurs mobiles"),
        ("ORAC", "Orange Côte d'Ivoire", "Télécoms", "Opérateurs mobiles"),
        ("ONTBF", "Onatel Burkina Faso", "Télécoms", "Opérateurs mobiles"),
        ("SGBC", "Société Générale CI", "Banques", "Banques universelles"),
        ("BICC", "BICI Côte d'Ivoire", "Banques", "Banques universelles"),
        ("ECOC", "Ecobank Côte d'Ivoire", "Banques", "Banques universelles"),
        ("NSBC", "NSIA Banque CI", "Banques", "Banques universelles"),
        ("SIBC", "Société Ivoirienne de Banque", "Banques", "Banques universelles"),
        ("BICB", "BIIC Bénin", "Banques", "Banques universelles"),
        ("BOAC", "Bank of Africa CI", "Banques", "Réseau BOA"),
        ("BOAB", "Bank of Africa Bénin", "Banques", "Réseau BOA"),
        ("BOABF", "Bank of Africa Burkina Faso", "Banques", "Réseau BOA"),
        ("BOAM", "Bank of Africa Mali", "Banques", "Réseau BOA"),
        ("BOAN", "Bank of Africa Niger", "Banques", "Réseau BOA"),
        ("BOAS", "Bank of Africa Sénégal", "Banques", "Réseau BOA"),
        ("ETIT", "Ecobank Transnational", "Banques", "Holdings panafricains"),
        ("CBIBF", "Coris Bank Burkina Faso", "Banques", "Holdings panafricains"),
        ("ORGT", "Oragroup Togo", "Banques", "Holdings panafricains"),
        ("SAFC", "Safca", "Banques", "Holdings panafricains"),
        ("NTLC", "Nestlé Côte d'Ivoire", "Industrie", "Alimentation & Tabac"),
        ("SLBC", "Solibra", "Industrie", "Alimentation & Tabac"),
        ("STBC", "Sitab", "Industrie", "Alimentation & Tabac"),
        ("NEIC", "Nei-Ceda", "Industrie", "Alimentation & Tabac"),
        ("SICC", "Sicor", "Industrie", "Alimentation & Tabac"),
        ("UNLC", "Unilever CI", "Industrie", "Biens de consommation"),
        ("UNXC", "Uniwax", "Industrie", "Biens de consommation"),
        ("CFAC", "CFAO Motors CI", "Industrie", "Automobile"),
        ("PRSC", "Tractafric Motors CI", "Industrie", "Automobile"),
        ("FTSC", "Filtisac", "Industrie", "Matériaux"),
        ("CABC", "Sicable", "Industrie", "Matériaux"),
        ("SEMC", "Eviosys Packaging", "Industrie", "Matériaux"),
        ("SIVC", "Erium", "Industrie", "Matériaux"),
        ("SMBC", "SMB", "Industrie", "Matériaux"),
        ("PALC", "Palmci", "Agriculture", "Cultures & Agro"),
        ("SPHC", "SAPH", "Agriculture", "Cultures & Agro"),
        ("SOGC", "SOGB", "Agriculture", "Cultures & Agro"),
        ("SCRC", "Sucrivoire", "Agriculture", "Cultures & Agro"),
        ("TTLC", "TotalEnergies CI", "Distribution", "Carburants"),
        ("TTLS", "TotalEnergies Sénégal", "Distribution", "Carburants"),
        ("SHEC", "Vivo Energy CI", "Distribution", "Carburants"),
        ("BNBC", "Bernabé", "Distribution", "Distribution générale"),
        ("CIEC", "CIE", "Services Publics", "Électricité"),
        ("SDCC", "Sodeci", "Services Publics", "Eau"),
        ("LNBB", "Loterie Nationale du Bénin", "Services Publics", "Jeux & Loteries"),
        ("SDSC", "Africa Global Logistics CI", "Transport", "Logistique"),
        ("STAC", "SETAO", "Transport", "Logistique"),
        ("ABJC", "Servair Abidjan", "Transport", "Aviation & Services"),
        ("SVOC", "Movis CI", "Transport", "Logistique"),
    ]

    async with AsyncSessionLocal() as session:
        # Upsert exchange
        existing = await session.get(Exchange, "BRVM")
        if not existing:
            session.add(Exchange(
                code="BRVM",
                name="Bourse Régionale des Valeurs Mobilières",
                country="UEMOA",
                timezone="Africa/Abidjan",
                market_open="09:00",
                market_close="15:00",
                currency="XOF",
            ))

        # Insert missing stocks
        for ticker, name, sector, sub in BRVM_STOCKS:
            result = await session.execute(
                select(Stock).where(Stock.ticker == ticker, Stock.exchange_code == "BRVM")
            )
            if not result.scalar_one_or_none():
                session.add(Stock(
                    ticker=ticker,
                    exchange_code="BRVM",
                    name=name,
                    sector=sector,
                    sub_industry=sub,
                ))

        await session.commit()
    logger.info("Initial data seeded")


app = FastAPI(
    title="Felix Finance API",
    version="1.0.0",
    description="BRVM market data API — extensible to NSE, GSE and beyond.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    t0 = _time.perf_counter()
    response = await call_next(request)
    ms = ((_time.perf_counter() - t0) * 1000)
    # Skip healthcheck spam at INFO — log it only at DEBUG
    if request.url.path == "/health":
        logger.debug("API  %-6s %-50s → %d  (%.0fms)", request.method, request.url.path, response.status_code, ms)
    else:
        logger.info("API  %-6s %-50s → %d  (%.0fms)", request.method, request.url.path, response.status_code, ms)
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/v1/{exchange}/quotes", response_model=list[QuoteOut])
async def get_all_quotes(exchange: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Quote)
        .where(Quote.exchange_code == exchange.upper())
        .order_by(Quote.ticker)
    )
    return result.scalars().all()


@app.get("/v1/{exchange}/quotes/{ticker}", response_model=QuoteOut)
async def get_quote(exchange: str, ticker: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Quote).where(
            Quote.exchange_code == exchange.upper(),
            Quote.ticker == ticker.upper(),
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail=f"No quote found for {ticker}")
    return row


@app.get("/v1/{exchange}/stocks/{ticker}/intraday", response_model=list[IntradayPointOut])
async def get_intraday(
    exchange: str,
    ticker: str,
    date: str = Query(default=None, description="YYYY-MM-DD, defaults to today"),
    db: AsyncSession = Depends(get_db),
):
    target = datetime.strptime(date, "%Y-%m-%d").date() if date else datetime.now(timezone.utc).date()
    # Use naive datetimes — column is TIMESTAMP WITHOUT TIME ZONE
    day_start = datetime(target.year, target.month, target.day, 0, 0, 0)
    day_end = day_start + timedelta(days=1)

    result = await db.execute(
        select(IntradaySnapshot)
        .where(
            IntradaySnapshot.exchange_code == exchange.upper(),
            IntradaySnapshot.ticker == ticker.upper(),
            IntradaySnapshot.ts >= day_start,
            IntradaySnapshot.ts < day_end,
        )
        .order_by(IntradaySnapshot.ts)
    )
    return result.scalars().all()


RANGE_DAYS = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "3M": 91,
    "6M": 182,
    "1Y": 365,
    "5Y": 1825,
}


@app.get("/v1/{exchange}/stocks/{ticker}/history", response_model=list[HistoryPointOut])
async def get_history(
    exchange: str,
    ticker: str,
    range: str = Query(default="1Y", description="1D|1W|1M|6M|1Y|5Y"),
    db: AsyncSession = Depends(get_db),
):
    days = RANGE_DAYS.get(range.upper(), 365)
    from_date = date.today() - timedelta(days=days)

    result = await db.execute(
        select(PriceHistory)
        .where(
            PriceHistory.exchange_code == exchange.upper(),
            PriceHistory.ticker == ticker.upper(),
            PriceHistory.trade_date >= from_date,
        )
        .order_by(PriceHistory.trade_date)
    )
    return result.scalars().all()


@app.get("/v1/{exchange}/market-stats", response_model=MarketStatsOut)
async def get_market_stats(exchange: str, db: AsyncSession = Depends(get_db)):
    exc = await db.get(Exchange, exchange.upper())
    currency = exc.currency if exc else "XOF"

    result = await db.execute(
        select(Quote).where(Quote.exchange_code == exchange.upper())
    )
    quotes = result.scalars().all()
    up = sum(1 for q in quotes if (q.change_pct or 0) > 0)
    down = sum(1 for q in quotes if (q.change_pct or 0) < 0)
    total_vol = sum(q.volume_xof or 0 for q in quotes)
    return MarketStatsOut(
        exchange_code=exchange.upper(),
        currency=currency,
        total=len(quotes),
        up=up,
        down=down,
        unchanged=len(quotes) - up - down,
        total_volume_xof=total_vol or None,
        computed_at=datetime.now(timezone.utc),
    )


@app.get("/v1/{exchange}/top-movers", response_model=list[TopMoverOut])
async def get_top_movers(
    exchange: str,
    days: int = Query(default=7, ge=1, le=365),
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Rank stocks by absolute % price change over the last `days` calendar days."""
    sql = text("""
        WITH latest AS (
            SELECT DISTINCT ON (ticker, exchange_code)
                ticker, exchange_code, close AS current_price, trade_date AS current_date
            FROM price_history
            WHERE exchange_code = :exchange
            ORDER BY ticker, exchange_code, trade_date DESC
        ),
        week_ago AS (
            SELECT DISTINCT ON (ticker, exchange_code)
                ticker, exchange_code, close AS week_price, trade_date AS week_date
            FROM price_history
            WHERE exchange_code = :exchange
              AND trade_date <= CURRENT_DATE - CAST(:days AS INTEGER) * INTERVAL '1 day'
            ORDER BY ticker, exchange_code, trade_date DESC
        ),
        ranked AS (
            SELECT
                l.ticker,
                l.exchange_code,
                l.current_price,
                w.week_price,
                ROUND(((l.current_price - w.week_price) / w.week_price * 100)::numeric, 2) AS change_pct_7d,
                ROW_NUMBER() OVER (
                    ORDER BY ABS((l.current_price - w.week_price) / w.week_price) DESC
                ) AS rank
            FROM latest l
            JOIN week_ago w ON l.ticker = w.ticker AND l.exchange_code = w.exchange_code
            WHERE w.week_price > 0
        )
        SELECT * FROM ranked
        ORDER BY rank
        LIMIT :limit
    """)
    result = await db.execute(sql, {"exchange": exchange.upper(), "days": days, "limit": limit})
    rows = result.mappings().all()
    return [TopMoverOut(**dict(r)) for r in rows]


@app.get("/v1/{exchange}/stocks/{ticker}/ai-insight", response_model=AIInsightOut)
async def get_ai_insight(exchange: str, ticker: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AIInsight).where(
            AIInsight.exchange_code == exchange.upper(),
            AIInsight.ticker == ticker.upper(),
        )
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail=f"No AI insight available for {ticker}")
    return row


@app.get("/v1/{exchange}/stocks", response_model=list[dict])
async def list_stocks(exchange: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Stock).where(Stock.exchange_code == exchange.upper()).order_by(Stock.ticker)
    )
    stocks = result.scalars().all()
    return [
        {"ticker": s.ticker, "name": s.name, "sector": s.sector, "sub_industry": s.sub_industry}
        for s in stocks
    ]
