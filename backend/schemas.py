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
