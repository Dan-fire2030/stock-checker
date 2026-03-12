import os
import httpx
from fastapi import APIRouter, Query, HTTPException
from services import finnhub_client
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("")
async def get_news(
    market: str = Query("all", pattern="^(jp|us|all)$"),
    limit: int = Query(30, ge=1, le=50),
):
    articles = []

    # Finnhub一般ニュース（主に米国・グローバル）
    if market in ("us", "all"):
        try:
            finnhub_news = finnhub_client.get_news("general")
            for item in finnhub_news[:limit]:
                articles.append({
                    "id": str(item.get("id", "")),
                    "headline": item.get("headline", ""),
                    "summary": item.get("summary", ""),
                    "url": item.get("url", ""),
                    "source": item.get("source", ""),
                    "published_at": item.get("datetime", 0),
                    "market": "us",
                    "image": item.get("image", ""),
                })
        except Exception:
            pass

    # MarketAux（日本株ニュース対応）
    marketaux_key = os.getenv("MARKETAUX_API_KEY")
    if marketaux_key and market in ("jp", "all"):
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "api_token": marketaux_key,
                    "countries": "jp",
                    "filter_entities": "true",
                    "limit": limit,
                    "language": "ja,en",
                }
                resp = await client.get("https://api.marketaux.com/v1/news/all", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("data", []):
                        articles.append({
                            "id": item.get("uuid", ""),
                            "headline": item.get("title", ""),
                            "summary": item.get("description", ""),
                            "url": item.get("url", ""),
                            "source": item.get("source", ""),
                            "published_at": item.get("published_at", ""),
                            "market": "jp",
                            "image": item.get("image_url", ""),
                        })
        except Exception:
            pass

    # 新しい順に並べ替え
    articles.sort(
        key=lambda x: x.get("published_at") or 0,
        reverse=True,
    )

    return {"articles": articles[:limit]}


@router.get("/stock/{symbol}")
async def get_stock_news(symbol: str, limit: int = Query(10, ge=1, le=20)):
    today = datetime.now().strftime("%Y-%m-%d")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    try:
        news = finnhub_client.get_company_news(symbol, week_ago, today)
        articles = [
            {
                "id": str(item.get("id", "")),
                "headline": item.get("headline", ""),
                "summary": item.get("summary", ""),
                "url": item.get("url", ""),
                "source": item.get("source", ""),
                "published_at": item.get("datetime", 0),
                "image": item.get("image", ""),
            }
            for item in news[:limit]
        ]
        return {"symbol": symbol, "articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
