"""
Sikafinance scraper — primary data provider for BRVM.

Current price:   GET https://www.sikafinance.com/marches/aaz
                 Static HTML table, all 47+ stocks in one page.
Historical:      GET https://www.sikafinance.com/marches/download/{TICKER}.{cc}
                 CSV response, ~1 year per request (period=365 param).
"""
import csv
import io
import logging
import time
from datetime import date, datetime, timedelta
from typing import Optional

import requests
from bs4 import BeautifulSoup

from providers.base import MarketDataProvider, QuoteData, HistoryPoint

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
}

# Map BRVM tickers to their sikafinance country suffix
TICKER_SUFFIX: dict[str, str] = {
    "SNTS": "sn",
    "ORAC": "ci", "SGBC": "ci", "BICC": "ci", "ECOC": "ci", "NSBC": "ci",
    "SIBC": "ci", "BOAC": "ci", "NTLC": "ci", "SLBC": "ci", "STBC": "ci",
    "NEIC": "ci", "SICC": "ci", "UNLC": "ci", "UNXC": "ci", "CFAC": "ci",
    "PRSC": "ci", "FTSC": "ci", "CABC": "ci", "SEMC": "ci", "SIVC": "ci",
    "SMBC": "ci", "PALC": "ci", "SPHC": "ci", "SOGC": "ci", "SCRC": "ci",
    "TTLC": "ci", "SHEC": "ci", "CIEC": "ci", "SDCC": "ci", "SDSC": "ci",
    "STAC": "ci", "ABJC": "ci",
    "BICB": "bj", "BOAB": "bj", "LNBB": "bj",
    "BOAN": "ne",
    "BOAM": "ml",
    "BOABF": "bf", "CBIBF": "bf", "ONTBF": "bf",
    "ETIT": "tg", "ORGT": "tg",
    "SAFC": "sn", "BOAS": "sn",
    "TTLS": "sn",
    "BNBC": "ci",
}

BASE_URL = "https://www.sikafinance.com"
EXCHANGE_CODE = "BRVM"


def _parse_fr_float(s: str) -> Optional[float]:
    """Parse French-formatted numbers like '31 495,00' or '31,495'."""
    if not s:
        return None
    s = s.strip().replace("\xa0", "").replace(" ", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


class SikafinanceScraper(MarketDataProvider):
    exchange_code = EXCHANGE_CODE

    def __init__(self, request_delay: float = 1.5):
        self._session = requests.Session()
        self._session.headers.update(HEADERS)
        self._delay = request_delay

    def fetch_all_quotes(self) -> list[QuoteData]:
        """Scrape https://www.sikafinance.com/marches/aaz for all BRVM quotes."""
        url = f"{BASE_URL}/marches/aaz"
        try:
            resp = self._session.get(url, timeout=20)
            resp.raise_for_status()
        except Exception as e:
            logger.error("Sikafinance fetch_all_quotes failed: %s", e)
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        quotes: list[QuoteData] = []

        # The main table has columns: Nom | Ouverture | +Haut | +Bas | Vol(titres) | Vol(XOF) | Dernier | Variation
        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            for row in rows[1:]:  # skip header
                cells = row.find_all("td")
                if len(cells) < 8:
                    continue

                # Extract ticker from the link in the first cell
                link = cells[0].find("a")
                if not link:
                    continue
                href = link.get("href", "")
                # href like /marches/cotation_SNTS.sn
                if "cotation_" not in href:
                    continue
                raw_ticker = href.split("cotation_")[-1].split(".")[0].upper()
                if not raw_ticker:
                    continue

                ticker = raw_ticker
                price = _parse_fr_float(cells[6].get_text(strip=True))
                if price is None:
                    continue

                open_ = _parse_fr_float(cells[1].get_text(strip=True))
                high = _parse_fr_float(cells[2].get_text(strip=True))
                low = _parse_fr_float(cells[3].get_text(strip=True))
                volume_str = cells[4].get_text(strip=True)
                volume_xof_str = cells[5].get_text(strip=True)
                change_str = cells[7].get_text(strip=True).replace("%", "").replace("+", "")

                quotes.append(
                    QuoteData(
                        ticker=ticker,
                        exchange_code=EXCHANGE_CODE,
                        price=price,
                        open=open_,
                        high=high,
                        low=low,
                        prev_close=open_,
                        change_pct=_parse_fr_float(change_str),
                        volume=int(_parse_fr_float(volume_str) or 0) or None,
                        volume_xof=_parse_fr_float(volume_xof_str),
                    )
                )

        logger.info("Sikafinance: scraped %d quotes", len(quotes))
        return quotes

    def fetch_history(self, ticker: str, from_date: date, to_date: date) -> list[HistoryPoint]:
        """
        Download CSV from sikafinance for a single ticker.
        The download endpoint is /marches/download/{TICKER}.{country_code}
        and accepts optional query params ?from=YYYY-MM-DD&to=YYYY-MM-DD.
        """
        suffix = TICKER_SUFFIX.get(ticker.upper(), "ci")
        slug = f"{ticker.lower()}.{suffix}"
        url = f"{BASE_URL}/marches/download/{slug}"
        params = {
            "from": from_date.strftime("%Y-%m-%d"),
            "to": to_date.strftime("%Y-%m-%d"),
        }

        try:
            time.sleep(self._delay)
            resp = self._session.get(url, params=params, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            logger.warning("Sikafinance history fetch failed for %s: %s", ticker, e)
            return []

        points: list[HistoryPoint] = []
        content = resp.text.strip()

        # Try to parse as CSV
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            # Expected columns: date, open, high, low, close, volume (French format)
            raw_date = row.get("date") or row.get("Date") or row.get("Dates", "").strip()
            raw_close = row.get("close") or row.get("Clôture") or row.get("Cloture", "").strip()
            if not raw_date or not raw_close:
                continue
            try:
                trade_date = datetime.strptime(raw_date, "%d/%m/%Y").date()
            except ValueError:
                try:
                    trade_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
                except ValueError:
                    continue

            close = _parse_fr_float(raw_close)
            if close is None:
                continue

            points.append(
                HistoryPoint(
                    ticker=ticker,
                    exchange_code=EXCHANGE_CODE,
                    trade_date=trade_date,
                    open=_parse_fr_float(row.get("open") or row.get("Ouverture", "")),
                    high=_parse_fr_float(row.get("high") or row.get("+Haut", "")),
                    low=_parse_fr_float(row.get("low") or row.get("+Bas", "")),
                    close=close,
                    volume=int(_parse_fr_float(row.get("volume") or row.get("Volume", "")) or 0) or None,
                    volume_xof=None,
                )
            )

        logger.info("Sikafinance: fetched %d history points for %s", len(points), ticker)
        return points

    def backfill_stock(self, ticker: str, years: int = 5) -> list[HistoryPoint]:
        """Fetch up to `years` of history in 1-year chunks."""
        all_points: list[HistoryPoint] = []
        today = date.today()
        for year_offset in range(years):
            to_d = today.replace(year=today.year - year_offset)
            from_d = to_d.replace(year=to_d.year - 1)
            pts = self.fetch_history(ticker, from_d, to_d)
            all_points.extend(pts)
            if not pts:
                break
        return all_points
