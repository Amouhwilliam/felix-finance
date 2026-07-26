"""
BRVM official website fallback scraper.
URL: https://www.brvm.org/fr/cours-actions/0
Columns: Symbole | Nom | Volume | Cours veille | Cours Ouverture | Cours Clôture | Variation (%)
Updates once at EOD — used as fallback / cross-validation.
"""
import logging
from typing import Optional

import requests
from bs4 import BeautifulSoup

from providers.base import MarketDataProvider, QuoteData, HistoryPoint
from datetime import date

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
}
BASE_URL = "https://www.brvm.org"
EXCHANGE_CODE = "BRVM"


def _parse_float(s: str) -> Optional[float]:
    if not s:
        return None
    s = s.strip().replace("\xa0", "").replace(" ", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


class BRVMOfficialProvider(MarketDataProvider):
    """EOD-only provider — use as fallback when Sikafinance is down."""

    exchange_code = EXCHANGE_CODE

    def __init__(self):
        self._session = requests.Session()
        self._session.headers.update(HEADERS)

    def fetch_all_quotes(self) -> list[QuoteData]:
        url = f"{BASE_URL}/fr/cours-actions/0"
        try:
            resp = self._session.get(url, timeout=20)
            resp.raise_for_status()
        except Exception as e:
            logger.error("BRVM official fetch failed: %s", e)
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        quotes: list[QuoteData] = []

        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            for row in rows[1:]:
                cells = row.find_all("td")
                if len(cells) < 7:
                    continue
                ticker = cells[0].get_text(strip=True)
                if not ticker:
                    continue
                close = _parse_float(cells[6].get_text(strip=True))  # Cours Clôture
                if close is None:
                    close = _parse_float(cells[3].get_text(strip=True))  # Cours veille
                if close is None:
                    continue
                quotes.append(
                    QuoteData(
                        ticker=ticker,
                        exchange_code=EXCHANGE_CODE,
                        price=close,
                        open=_parse_float(cells[5].get_text(strip=True)),
                        high=None,
                        low=None,
                        prev_close=_parse_float(cells[3].get_text(strip=True)),
                        change_pct=_parse_float(
                            cells[7].get_text(strip=True).replace("%", "").replace("+", "")
                        ) if len(cells) > 7 else None,
                        volume=int(_parse_float(cells[2].get_text(strip=True)) or 0) or None,
                        volume_xof=None,
                    )
                )

        logger.info("BRVM official: scraped %d quotes", len(quotes))
        return quotes

    def fetch_history(self, ticker: str, from_date: date, to_date: date) -> list[HistoryPoint]:
        # BRVM official site has no historical data endpoint
        logger.warning("BRVMOfficialProvider.fetch_history: not supported")
        return []
