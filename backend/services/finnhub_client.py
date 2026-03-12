import os
import finnhub
from functools import lru_cache
from typing import Optional
import time

_client: Optional[finnhub.Client] = None
_cache: dict = {}
CACHE_TTL = 900  # 15分


def get_client() -> finnhub.Client:
    global _client
    if _client is None:
        api_key = os.getenv("FINNHUB_API_KEY")
        if not api_key:
            raise ValueError("FINNHUB_API_KEY が設定されていません")
        _client = finnhub.Client(api_key=api_key)
    return _client


def _cached(key: str, fetch_fn):
    now = time.time()
    if key in _cache:
        value, ts = _cache[key]
        if now - ts < CACHE_TTL:
            return value
    value = fetch_fn()
    _cache[key] = (value, now)
    return value


def get_quote(symbol: str) -> dict:
    return _cached(f"quote:{symbol}", lambda: get_client().quote(symbol))


def search_symbol(query: str) -> dict:
    return _cached(f"search:{query}", lambda: get_client().symbol_lookup(query))


def get_company_profile(symbol: str) -> dict:
    return _cached(f"profile:{symbol}", lambda: get_client().company_profile2(symbol=symbol))


def get_basic_financials(symbol: str) -> dict:
    return _cached(f"financials:{symbol}", lambda: get_client().company_basic_financials(symbol, "all"))


def get_news(category: str = "general", min_id: int = 0) -> list:
    return _cached(f"news:{category}", lambda: get_client().general_news(category, min_id=min_id))


def get_company_news(symbol: str, from_date: str, to_date: str) -> list:
    key = f"company_news:{symbol}:{from_date}:{to_date}"
    return _cached(key, lambda: get_client().company_news(symbol, _from=from_date, to=to_date))
