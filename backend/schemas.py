from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class QuoteOut(BaseModel):
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
    scraped_at: datetime

    model_config = {"from_attributes": True}


class HistoryPointOut(BaseModel):
    trade_date: date
    open: Optional[float]
    high: Optional[float]
    low: Optional[float]
    close: float
    volume: Optional[int]

    model_config = {"from_attributes": True}


class IntradayPointOut(BaseModel):
    ts: datetime
    price: float
    change_pct: Optional[float]
    volume: Optional[int]

    model_config = {"from_attributes": True}


class MarketStatsOut(BaseModel):
    exchange_code: str
    total: int
    up: int
    down: int
    unchanged: int
    total_volume_xof: Optional[float]
    computed_at: datetime


class AIInsightOut(BaseModel):
    ticker: str
    exchange_code: str
    sentiment: str            # "bullish" | "neutral" | "bearish"
    insight_text: str
    buy_pct: int
    hold_pct: int
    sell_pct: int
    provider: Optional[str]
    generated_at: datetime
    valid_until: datetime

    model_config = {"from_attributes": True}
