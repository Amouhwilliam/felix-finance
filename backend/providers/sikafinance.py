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
from datetime import date, datetime
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
    "SVOC": "ci",
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
        logger.info("SIKA  ► GET %s", url)
        t0 = time.perf_counter()
        try:
            resp = self._session.get(url, timeout=20)
            resp.raise_for_status()
            elapsed = time.perf_counter() - t0
            logger.info("SIKA  ◄ %d OK  %.1fs  %d bytes", resp.status_code, elapsed, len(resp.content))
        except Exception as e:
            logger.error("SIKA  ✗ fetch_all_quotes failed: %s", e)
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
                    logger.debug("SIKA  skip %-8s — no price", ticker)
                    continue

                open_ = _parse_fr_float(cells[1].get_text(strip=True))
                high = _parse_fr_float(cells[2].get_text(strip=True))
                low = _parse_fr_float(cells[3].get_text(strip=True))
                volume_str = cells[4].get_text(strip=True)
                volume_xof_str = cells[5].get_text(strip=True)
                change_str = cells[7].get_text(strip=True).replace("%", "").replace("+", "")
                change_pct = _parse_fr_float(change_str)

                quotes.append(
                    QuoteData(
                        ticker=ticker,
                        exchange_code=EXCHANGE_CODE,
                        price=price,
                        open=open_,
                        high=high,
                        low=low,
                        prev_close=open_,
                        change_pct=change_pct,
                        volume=int(_parse_fr_float(volume_str) or 0) or None,
                        volume_xof=_parse_fr_float(volume_xof_str),
                    )
                )
                logger.debug(
                    "SIKA  %-8s  price=%9.0f  open=%9.0f  high=%9.0f  low=%9.0f  chg=%+.2f%%  vol=%s",
                    ticker, price, open_ or 0, high or 0, low or 0, change_pct or 0,
                    f"{int(_parse_fr_float(volume_str) or 0):,}" if volume_str else "—",
                )

        logger.info("SIKA  parsed %d quotes from HTML table", len(quotes))
        return quotes

    def _get_csrf_token(self, slug: str) -> str:
        """GET the download page and extract the CSRF token required for the POST."""
        url = f"{BASE_URL}/marches/download/{slug}"
        logger.debug("SIKA  ► CSRF GET %s", url)
        t0 = time.perf_counter()
        try:
            resp = self._session.get(url, timeout=20)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            token_el = soup.find("input", {"name": "__RequestVerificationToken"})
            token = token_el["value"] if token_el else ""
            logger.debug("SIKA  ◄ CSRF token acquired for %s (%.1fs)", slug, time.perf_counter() - t0)
            return token
        except Exception as e:
            logger.warning("SIKA  ✗ CSRF fetch failed for %s: %s", slug, e)
            return ""

    def fetch_history(
        self,
        ticker: str,
        from_date: date,
        to_date: date,
        _cached_csrf: Optional[str] = None,
    ) -> list[HistoryPoint]:
        """
        Download CSV from sikafinance for a single ticker.
        Requires a two-step flow: GET the page to extract a CSRF token,
        then POST with dtFrom / dtTo (max 1 month per request).

        Pass `_cached_csrf` to skip the GET and reuse a token already fetched
        by the caller (e.g. backfill_stock fetches it once per ticker).

        CSV format returned: semicolon-separated with columns
          symbole;date;ouverture;haut;bas;cloture;volume
        Dates are DD/MM/YYYY, values are plain integers (no French formatting).
        """
        suffix = TICKER_SUFFIX.get(ticker.upper(), "ci")
        slug = f"{ticker.lower()}.{suffix}"
        url = f"{BASE_URL}/marches/download/{slug}"

        csrf = _cached_csrf or self._get_csrf_token(slug)

        def _do_post(token: str):
            time.sleep(self._delay)
            logger.debug(
                "SIKA  ► POST history %-8s  %s → %s",
                ticker, from_date.isoformat(), to_date.isoformat(),
            )
            t0 = time.perf_counter()
            r = self._session.post(
                url,
                data={
                    "dtFrom": from_date.strftime("%Y-%m-%d"),
                    "dtTo": to_date.strftime("%Y-%m-%d"),
                    "__RequestVerificationToken": token,
                },
                timeout=30,
            )
            logger.debug(
                "SIKA  ◄ POST history %-8s  %d  %.1fs  %d bytes  ct=%s",
                ticker, r.status_code, time.perf_counter() - t0, len(r.content),
                r.headers.get("Content-Type", "?")[:30],
            )
            return r

        try:
            resp = _do_post(csrf)
            resp.raise_for_status()
        except Exception as e:
            logger.warning("SIKA  ✗ history fetch failed for %s: %s", ticker, e)
            return []

        # If server returned HTML, the token may have expired — retry with a fresh one
        if "text/html" in resp.headers.get("Content-Type", ""):
            if _cached_csrf:
                logger.info("SIKA  ↺ CSRF expired for %s — refreshing token and retrying", ticker)
                csrf = self._get_csrf_token(slug)
                try:
                    resp = _do_post(csrf)
                    resp.raise_for_status()
                except Exception as e:
                    logger.warning("SIKA  ✗ retry failed for %s: %s", ticker, e)
                    return []
            if "text/html" in resp.headers.get("Content-Type", ""):
                logger.warning("SIKA  ✗ still HTML for %s (%s→%s) — skipping chunk", ticker, from_date, to_date)
                return []

        points: list[HistoryPoint] = []
        content = resp.text.strip()

        # CSV uses semicolons: symbole;date;ouverture;haut;bas;cloture;volume
        reader = csv.DictReader(io.StringIO(content), delimiter=";")
        for row in reader:
            raw_date = (row.get("date") or "").strip()
            raw_close = (row.get("cloture") or "").strip()
            if not raw_date or not raw_close:
                continue
            try:
                trade_date = datetime.strptime(raw_date, "%d/%m/%Y").date()
            except ValueError:
                try:
                    trade_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
                except ValueError:
                    logger.debug("SIKA  skip bad date row for %s: %r", ticker, raw_date)
                    continue

            close = _parse_fr_float(raw_close)
            if close is None:
                continue

            points.append(
                HistoryPoint(
                    ticker=ticker,
                    exchange_code=EXCHANGE_CODE,
                    trade_date=trade_date,
                    open=_parse_fr_float(row.get("ouverture", "")),
                    high=_parse_fr_float(row.get("haut", "")),
                    low=_parse_fr_float(row.get("bas", "")),
                    close=close,
                    volume=int(_parse_fr_float(row.get("volume", "")) or 0) or None,
                    volume_xof=None,
                )
            )

        logger.debug("SIKA  history %-8s  %s→%s  → %d rows", ticker, from_date, to_date, len(points))
        return points

    def backfill_stock(self, ticker: str, years: float = 5, months: int | None = None) -> list[HistoryPoint]:
        """
        Fetch history in 1-month chunks.
        Pass `months` directly for a quick catch-up (e.g. months=2).
        Pass `years` for a full historical load (default: 5 years = 60 months).
        Sikafinance enforces a 1-month maximum per download request.
        """
        import calendar as cal
        all_points: list[HistoryPoint] = []
        today = date.today()
        total_months = months if months is not None else round(years * 12)
        empty_streak = 0

        suffix = TICKER_SUFFIX.get(ticker.upper(), "ci")
        slug = f"{ticker.lower()}.{suffix}"

        logger.info("SIKA  backfill START  %-8s  %d years (%d months)", ticker, years, total_months)

        # Fetch CSRF token once for all monthly chunks
        cached_csrf = self._get_csrf_token(slug)

        for month_offset in range(total_months):
            # Compute to_date: today's day in (year, month - month_offset)
            m_to = today.month - month_offset
            y_to = today.year
            while m_to <= 0:
                m_to += 12
                y_to -= 1

            # Compute from_date: same day, one month earlier
            m_from = m_to - 1 if m_to > 1 else 12
            y_from = y_to if m_to > 1 else y_to - 1

            # Clamp day to valid range for each month
            day_to = min(today.day, cal.monthrange(y_to, m_to)[1])
            day_from = min(today.day, cal.monthrange(y_from, m_from)[1])

            to_d = date(y_to, m_to, day_to)
            from_d = date(y_from, m_from, day_from)

            pts = self.fetch_history(ticker, from_d, to_d, _cached_csrf=cached_csrf)
            if pts:
                all_points.extend(pts)
                empty_streak = 0
            else:
                empty_streak += 1
                logger.debug("SIKA  backfill %-8s  empty chunk %s→%s  (streak=%d)", ticker, from_d, to_d, empty_streak)
                if month_offset > 0 and empty_streak >= 3:
                    logger.info("SIKA  backfill %-8s  3 empty months → reached start of data", ticker)
                    break  # 3 consecutive empty months → reached start of data

        logger.info("SIKA  backfill DONE   %-8s  %d total rows collected", ticker, len(all_points))
        return all_points
