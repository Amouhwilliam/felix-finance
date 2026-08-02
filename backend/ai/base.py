"""Model-agnostic AI provider interface for stock insights."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class StockContext:
    """Data passed to the AI to generate insights."""
    ticker: str
    name: str
    sector: str
    exchange: str
    current_price: float
    change_pct_today: float
    change_pct_1m: Optional[float]   # % change over last month
    change_pct_1y: Optional[float]   # % change over last year
    price_52w_high: Optional[float]
    price_52w_low: Optional[float]
    volume_avg: Optional[int]


@dataclass
class AIInsightResult:
    sentiment: str           # "bullish" | "neutral" | "bearish"
    insight_text: str        # 2-3 sentence plain-language analysis in French
    buy_pct: int             # suggested buy consensus 0-100
    hold_pct: int
    sell_pct: int            # buy + hold + sell must equal 100


class AIProvider(ABC):
    """Abstract base for all AI providers (Bedrock, OpenAI, etc.)."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable name, e.g. 'bedrock-deepseek-v3'."""

    @abstractmethod
    def generate_insight(self, ctx: StockContext) -> AIInsightResult:
        """Generate a stock insight synchronously."""
