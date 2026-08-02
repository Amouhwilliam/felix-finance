"""SQLAlchemy ORM models for Felix Finance."""
from datetime import datetime, date
from sqlalchemy import (
    String, Float, Integer, DateTime, Date, BigInteger, Text,
    UniqueConstraint, Index, text
)
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Exchange(Base):
    """Supported stock exchanges — extensible (BRVM, NSE, GSE, ...)."""
    __tablename__ = "exchanges"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)  # "BRVM", "NSE"
    name: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(60))
    timezone: Mapped[str] = mapped_column(String(50), default="Africa/Abidjan")
    market_open: Mapped[str] = mapped_column(String(5), default="09:00")
    market_close: Mapped[str] = mapped_column(String(5), default="15:00")
    currency: Mapped[str] = mapped_column(String(10), default="XOF")


class Stock(Base):
    """Master list of listed securities, keyed by (ticker, exchange_code)."""
    __tablename__ = "stocks"
    __table_args__ = (
        UniqueConstraint("ticker", "exchange_code", name="uq_stock_ticker_exchange"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    exchange_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200))
    sector: Mapped[str] = mapped_column(String(100), nullable=True)
    sub_industry: Mapped[str] = mapped_column(String(100), nullable=True)
    isin: Mapped[str] = mapped_column(String(20), nullable=True)
    shares_outstanding: Mapped[int] = mapped_column(BigInteger, nullable=True)
    logo_url: Mapped[str] = mapped_column(String(300), nullable=True)


class Quote(Base):
    """Latest snapshot per stock — upserted every scrape cycle."""
    __tablename__ = "quotes"
    __table_args__ = (
        UniqueConstraint("ticker", "exchange_code", name="uq_quote_ticker_exchange"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    exchange_code: Mapped[str] = mapped_column(String(10), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    open: Mapped[float] = mapped_column(Float, nullable=True)
    high: Mapped[float] = mapped_column(Float, nullable=True)
    low: Mapped[float] = mapped_column(Float, nullable=True)
    prev_close: Mapped[float] = mapped_column(Float, nullable=True)
    change_pct: Mapped[float] = mapped_column(Float, nullable=True)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=True)
    volume_xof: Mapped[float] = mapped_column(Float, nullable=True)
    mkt_cap: Mapped[float] = mapped_column(Float, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class IntradaySnapshot(Base):
    """Every scrape result stored for 1D intraday chart (7-day retention)."""
    __tablename__ = "intraday_snapshots"
    __table_args__ = (
        Index("ix_intraday_ticker_exchange_ts", "ticker", "exchange_code", "ts"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    exchange_code: Mapped[str] = mapped_column(String(10), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    change_pct: Mapped[float] = mapped_column(Float, nullable=True)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=True)
    ts: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class PriceHistory(Base):
    """Daily OHLCV candles — used for 1W, 1M, 6M, 1Y, 5Y charts."""
    __tablename__ = "price_history"
    __table_args__ = (
        UniqueConstraint("ticker", "exchange_code", "trade_date", name="uq_ph_ticker_date"),
        Index("ix_ph_ticker_exchange_date", "ticker", "exchange_code", "trade_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False)
    exchange_code: Mapped[str] = mapped_column(String(10), nullable=False)
    trade_date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[float] = mapped_column(Float, nullable=True)
    high: Mapped[float] = mapped_column(Float, nullable=True)
    low: Mapped[float] = mapped_column(Float, nullable=True)
    close: Mapped[float] = mapped_column(Float, nullable=False)
    volume: Mapped[int] = mapped_column(BigInteger, nullable=True)
    volume_xof: Mapped[float] = mapped_column(Float, nullable=True)


class AIInsight(Base):
    """Weekly AI-generated stock insights — cached for 7 days."""
    __tablename__ = "ai_insights"
    __table_args__ = (
        UniqueConstraint("ticker", "exchange_code", name="uq_ai_insight_ticker_exchange"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    exchange_code: Mapped[str] = mapped_column(String(10), nullable=False)
    sentiment: Mapped[str] = mapped_column(String(10), nullable=False, default="neutral")
    insight_text: Mapped[str] = mapped_column(Text, nullable=False)
    buy_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=33)
    hold_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=34)
    sell_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=33)
    provider: Mapped[str] = mapped_column(String(60), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    valid_until: Mapped[datetime] = mapped_column(DateTime, nullable=False)
