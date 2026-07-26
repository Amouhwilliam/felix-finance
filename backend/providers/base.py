"""Abstract provider interface — swap data sources without touching the API layer."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class QuoteData:
    ticker: str
    exchange_code: str
    price: float
    open: Optional[float]
    high: Optional[float]
    low: Optional[float]
    prev_close: Optional[float]
    change_pct: Optional[float]
    volume: Optional[int]
    volume_xof: Optional[float]


@dataclass
class HistoryPoint:
    ticker: str
    exchange_code: str
    trade_date: date
    open: Optional[float]
    high: Optional[float]
    low: Optional[float]
    close: float
    volume: Optional[int]
    volume_xof: Optional[float]


class MarketDataProvider(ABC):
    """All data sources implement this interface."""

    exchange_code: str

    @abstractmethod
    def fetch_all_quotes(self) -> list[QuoteData]:
        """Fetch latest quotes for every listed security on the exchange."""
        ...

    @abstractmethod
    def fetch_history(self, ticker: str, from_date: date, to_date: date) -> list[HistoryPoint]:
        """Fetch daily OHLCV for a single ticker over a date range."""
        ...

    def is_market_open(self) -> bool:
        """Return True during trading hours (Mon–Fri 09:00–15:00 GMT for BRVM)."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if now.weekday() >= 5:
            return False
        return 9 <= now.hour < 15
