import yfinance as yf
import time
from typing import Optional

_cache: dict = {}
CACHE_TTL = 900  # 15分


def _cached(key: str, fetch_fn):
    now = time.time()
    if key in _cache:
        value, ts = _cache[key]
        if now - ts < CACHE_TTL:
            return value
    value = fetch_fn()
    _cache[key] = (value, now)
    return value


def get_ticker_info(symbol: str) -> dict:
    def fetch():
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "roe": info.get("returnOnEquity"),
            "dividend_yield": info.get("dividendYield"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "currency": info.get("currency", ""),
            "exchange": info.get("exchange", ""),
        }
    return _cached(f"info:{symbol}", fetch)


def get_chart_data(symbol: str, period: str = "3mo") -> list[dict]:
    period_map = {"1m": "1mo", "3m": "3mo", "1y": "1y"}
    yf_period = period_map.get(period, "3mo")

    def fetch():
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=yf_period)
        result = []
        for date, row in hist.iterrows():
            result.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return result

    return _cached(f"chart:{symbol}:{yf_period}", fetch)


def get_moving_averages(symbol: str) -> dict:
    def fetch():
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1y")
        if len(hist) < 50:
            return {"ma50": None, "ma200": None, "volume_trend": None}
        closes = hist["Close"]
        ma50 = float(closes.tail(50).mean())
        ma200 = float(closes.mean()) if len(closes) >= 200 else None
        # 出来高トレンド: 直近20日 vs 前20日
        volumes = hist["Volume"]
        recent_vol = float(volumes.tail(20).mean())
        prev_vol = float(volumes.iloc[-40:-20].mean()) if len(volumes) >= 40 else None
        volume_trend = (recent_vol / prev_vol - 1) if prev_vol else None
        return {
            "ma50": round(ma50, 2),
            "ma200": round(ma200, 2) if ma200 else None,
            "volume_trend": round(volume_trend, 4) if volume_trend else None,
        }
    return _cached(f"ma:{symbol}", fetch)
