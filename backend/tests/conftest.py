import sys
import os

# backendディレクトリをパスに追加（routers/services等をインポートするため）
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="session")
def client():
    """FastAPI テストクライアント（セッション全体で共有）"""
    with TestClient(app) as c:
        yield c


# --- モック用ダミーデータ ---

MOCK_TICKER_INFO = {
    "name": "Apple Inc.",
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "market_cap": 3_000_000_000_000,
    "pe_ratio": 28.5,
    "pb_ratio": 45.0,
    "roe": 1.47,  # 147% (小数表記)
    "dividend_yield": 0.005,
    "52_week_high": 260.0,
    "52_week_low": 164.0,
}

MOCK_MA_DATA = {
    "ma50": 220.0,
    "ma200": 200.0,
    "volume_trend": 0.05,
}

MOCK_CHART_DATA = [
    {"date": f"2024-{i:02d}-01", "open": 200.0, "high": 210.0, "low": 195.0, "close": 205.0 + i, "volume": 50_000_000}
    for i in range(1, 61)  # 60日分
]

MOCK_QUOTE = {
    "c": 220.0,   # 現在値
    "d": 2.5,     # 前日比
    "dp": 1.15,   # 前日比(%)
    "h": 225.0,   # 高値
    "l": 218.0,   # 安値
    "o": 219.0,   # 始値
    "pc": 217.5,  # 前日終値
}

MOCK_NEWS = [
    {
        "id": 1,
        "headline": "Apple reports record earnings",
        "summary": "Apple Inc. reported record Q1 earnings.",
        "url": "https://example.com/news/1",
        "source": "Reuters",
        "datetime": 1700000000,
        "image": "",
    },
    {
        "id": 2,
        "headline": "Tech stocks rise",
        "summary": "Technology stocks surge amid optimism.",
        "url": "https://example.com/news/2",
        "source": "Bloomberg",
        "datetime": 1700000100,
        "image": "",
    },
]

MOCK_SEARCH_RESULTS = {
    "result": [
        {"symbol": "AAPL", "displaySymbol": "AAPL", "description": "APPLE INC", "type": "Common Stock"},
        {"symbol": "AAPL.SW", "displaySymbol": "AAPL", "description": "APPLE INC", "type": "Common Stock"},
        {"symbol": "AAPL.MX", "displaySymbol": "AAPL", "description": "APPLE INC", "type": "EQS"},
        {"symbol": "AAPLW", "displaySymbol": "AAPLW", "description": "APPLE WARRANT", "type": "Warrant"},  # フィルタ対象
    ]
}
