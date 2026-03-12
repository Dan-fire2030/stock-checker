from fastapi import APIRouter, HTTPException, Query
from services import finnhub_client, yfinance_service
from services.screener import score_stock, calculate_rsi

router = APIRouter(prefix="/api/stocks", tags=["stocks"])

# 人気日本株・米国株のデフォルトリスト
JP_SYMBOLS = ["7203.T", "6758.T", "9984.T", "8306.T", "6861.T", "7974.T", "4519.T", "9433.T"]
US_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM"]


@router.get("/search")
async def search_stocks(
    q: str = Query(..., min_length=1),
    market: str = Query("all", pattern="^(jp|us|all)$"),
):
    results = finnhub_client.search_symbol(q)
    items = results.get("result", [])

    filtered = []
    for item in items:
        symbol = item.get("symbol", "")
        display_symbol = item.get("displaySymbol", symbol)
        description = item.get("description", "")
        type_ = item.get("type", "")

        if type_ not in ("Common Stock", "EQS"):
            continue

        is_jp = symbol.endswith(".T") or symbol.endswith(".JP")
        if market == "jp" and not is_jp:
            continue
        if market == "us" and is_jp:
            continue

        filtered.append({
            "symbol": symbol,
            "display_symbol": display_symbol,
            "name": description,
            "market": "jp" if is_jp else "us",
        })

    return {"results": filtered[:20]}


@router.get("/top-picks")
async def top_picks(
    market: str = Query("all", pattern="^(jp|us|all)$"),
    limit: int = Query(20, ge=1, le=50),
):
    symbols = []
    if market in ("jp", "all"):
        symbols += JP_SYMBOLS
    if market in ("us", "all"):
        symbols += US_SYMBOLS

    scored = []
    for symbol in symbols:
        try:
            info = yfinance_service.get_ticker_info(symbol)
            ma_data = yfinance_service.get_moving_averages(symbol)
            chart = yfinance_service.get_chart_data(symbol, "3m")
            closes = [d["close"] for d in chart]
            rsi = calculate_rsi(closes)

            result = score_stock(
                rsi=rsi,
                ma50=ma_data.get("ma50"),
                ma200=ma_data.get("ma200"),
                volume_trend=ma_data.get("volume_trend"),
                pe_ratio=info.get("pe_ratio"),
                pb_ratio=info.get("pb_ratio"),
                roe=info.get("roe"),
            )

            quote = finnhub_client.get_quote(symbol)
            scored.append({
                "symbol": symbol,
                "name": info.get("name", ""),
                "market": "jp" if symbol.endswith(".T") else "us",
                "price": quote.get("c"),
                "change_pct": round(quote.get("dp", 0), 2),
                "score": result["total"],
                "sector": info.get("sector", ""),
            })
        except Exception:
            continue

    scored.sort(key=lambda x: x["score"], reverse=True)
    return {"picks": scored[:limit]}


@router.get("/{symbol}")
async def get_stock_detail(symbol: str):
    try:
        info = yfinance_service.get_ticker_info(symbol)
        ma_data = yfinance_service.get_moving_averages(symbol)
        chart = yfinance_service.get_chart_data(symbol, "3m")
        closes = [d["close"] for d in chart]
        rsi = calculate_rsi(closes)
        quote = finnhub_client.get_quote(symbol)

        score_result = score_stock(
            rsi=rsi,
            ma50=ma_data.get("ma50"),
            ma200=ma_data.get("ma200"),
            volume_trend=ma_data.get("volume_trend"),
            pe_ratio=info.get("pe_ratio"),
            pb_ratio=info.get("pb_ratio"),
            roe=info.get("roe"),
        )

        return {
            "symbol": symbol,
            "name": info.get("name", ""),
            "market": "jp" if symbol.endswith(".T") else "us",
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "price": quote.get("c"),
            "change": quote.get("d"),
            "change_pct": quote.get("dp"),
            "high": quote.get("h"),
            "low": quote.get("l"),
            "open": quote.get("o"),
            "prev_close": quote.get("pc"),
            "market_cap": info.get("market_cap"),
            "pe_ratio": info.get("pe_ratio"),
            "pb_ratio": info.get("pb_ratio"),
            "roe": info.get("roe"),
            "dividend_yield": info.get("dividend_yield"),
            "52_week_high": info.get("52_week_high"),
            "52_week_low": info.get("52_week_low"),
            "rsi": rsi,
            "ma50": ma_data.get("ma50"),
            "ma200": ma_data.get("ma200"),
            "volume_trend": ma_data.get("volume_trend"),
            "score": score_result,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"銘柄データを取得できませんでした: {str(e)}")


@router.get("/{symbol}/chart")
async def get_chart(symbol: str, period: str = Query("3m", pattern="^(1m|3m|1y)$")):
    try:
        data = yfinance_service.get_chart_data(symbol, period)
        return {"symbol": symbol, "period": period, "data": data}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
