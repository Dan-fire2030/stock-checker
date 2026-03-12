from fastapi import APIRouter
from services import finnhub_client, yfinance_service

router = APIRouter(prefix="/api", tags=["market"])

# 主要インデックスのシンボル
INDICES = {
    "sp500": "^GSPC",
    "nikkei": "^N225",
    "topix": "^TPX",
    "nasdaq": "^IXIC",
    "dow": "^DJI",
}


@router.get("/market-overview")
async def market_overview():
    overview = {}
    for name, symbol in INDICES.items():
        try:
            chart = yfinance_service.get_chart_data(symbol, "1m")
            if chart:
                latest = chart[-1]
                prev = chart[-2] if len(chart) >= 2 else None
                change_pct = None
                if prev:
                    change_pct = round((latest["close"] - prev["close"]) / prev["close"] * 100, 2)
                overview[name] = {
                    "symbol": symbol,
                    "price": latest["close"],
                    "change_pct": change_pct,
                }
        except Exception:
            overview[name] = {"symbol": symbol, "price": None, "change_pct": None}

    return {"indices": overview}
