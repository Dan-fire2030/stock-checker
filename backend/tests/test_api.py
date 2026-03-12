"""
APIエンドポイントの統合テスト
外部API（Finnhub, yfinance）はモックして、ルーターのロジックを検証する
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

from tests.conftest import (
    MOCK_TICKER_INFO,
    MOCK_MA_DATA,
    MOCK_CHART_DATA,
    MOCK_QUOTE,
    MOCK_NEWS,
    MOCK_SEARCH_RESULTS,
)

client = TestClient(app)


# ===== /health =====

def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# ===== /api/stocks/search =====

class TestStockSearch:
    @patch("routers.stocks.finnhub_client.search_symbol", return_value=MOCK_SEARCH_RESULTS)
    def test_search_returns_common_stocks_only(self, _):
        """Warrantなど株式以外はフィルタされる"""
        resp = client.get("/api/stocks/search?q=apple")
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        # Warrantタイプ(AAPLW)は除外される
        symbols = [r["symbol"] for r in data["results"]]
        assert "AAPLW" not in symbols

    @patch("routers.stocks.finnhub_client.search_symbol", return_value=MOCK_SEARCH_RESULTS)
    def test_search_market_filter_us(self, _):
        """market=us → 日本株(.T)は除外"""
        resp = client.get("/api/stocks/search?q=apple&market=us")
        assert resp.status_code == 200
        for item in resp.json()["results"]:
            assert not item["symbol"].endswith(".T")

    @patch("routers.stocks.finnhub_client.search_symbol", return_value={"result": []})
    def test_search_empty_results(self, _):
        """結果なしの場合は空リスト"""
        resp = client.get("/api/stocks/search?q=xyznotexist")
        assert resp.status_code == 200
        assert resp.json() == {"results": []}

    def test_search_requires_query(self):
        """qパラメータなしは422"""
        resp = client.get("/api/stocks/search")
        assert resp.status_code == 422

    def test_search_invalid_market(self):
        """不正なmarket値は422"""
        resp = client.get("/api/stocks/search?q=apple&market=invalid")
        assert resp.status_code == 422

    @patch("routers.stocks.finnhub_client.search_symbol", return_value=MOCK_SEARCH_RESULTS)
    def test_search_result_has_required_fields(self, _):
        """レスポンスに必要フィールドが含まれる"""
        resp = client.get("/api/stocks/search?q=apple")
        results = resp.json()["results"]
        if results:
            item = results[0]
            assert "symbol" in item
            assert "name" in item
            assert "market" in item
            assert item["market"] in ("jp", "us")


# ===== /api/stocks/top-picks =====

class TestTopPicks:
    @patch("routers.stocks.yfinance_service.get_ticker_info", return_value=MOCK_TICKER_INFO)
    @patch("routers.stocks.yfinance_service.get_moving_averages", return_value=MOCK_MA_DATA)
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    @patch("routers.stocks.finnhub_client.get_quote", return_value=MOCK_QUOTE)
    def test_top_picks_returns_scored_list(self, *_):
        resp = client.get("/api/stocks/top-picks?market=us&limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert "picks" in data
        assert len(data["picks"]) <= 5

    @patch("routers.stocks.yfinance_service.get_ticker_info", return_value=MOCK_TICKER_INFO)
    @patch("routers.stocks.yfinance_service.get_moving_averages", return_value=MOCK_MA_DATA)
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    @patch("routers.stocks.finnhub_client.get_quote", return_value=MOCK_QUOTE)
    def test_top_picks_sorted_by_score(self, *_):
        """スコアの降順で返される"""
        resp = client.get("/api/stocks/top-picks?market=us")
        picks = resp.json()["picks"]
        scores = [p["score"] for p in picks]
        assert scores == sorted(scores, reverse=True)

    @patch("routers.stocks.yfinance_service.get_ticker_info", return_value=MOCK_TICKER_INFO)
    @patch("routers.stocks.yfinance_service.get_moving_averages", return_value=MOCK_MA_DATA)
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    @patch("routers.stocks.finnhub_client.get_quote", return_value=MOCK_QUOTE)
    def test_top_picks_item_fields(self, *_):
        """各銘柄に必要フィールドが含まれる"""
        resp = client.get("/api/stocks/top-picks?market=us&limit=1")
        picks = resp.json()["picks"]
        if picks:
            item = picks[0]
            for field in ("symbol", "name", "market", "price", "change_pct", "score", "sector"):
                assert field in item, f"フィールド '{field}' がない"

    def test_top_picks_invalid_market(self):
        resp = client.get("/api/stocks/top-picks?market=invalid")
        assert resp.status_code == 422

    @patch("routers.stocks.yfinance_service.get_ticker_info", side_effect=Exception("API error"))
    @patch("routers.stocks.yfinance_service.get_moving_averages", side_effect=Exception("API error"))
    @patch("routers.stocks.yfinance_service.get_chart_data", side_effect=Exception("API error"))
    @patch("routers.stocks.finnhub_client.get_quote", side_effect=Exception("API error"))
    def test_top_picks_handles_api_errors_gracefully(self, *_):
        """外部APIエラーがあっても500にならず空リストで返る"""
        resp = client.get("/api/stocks/top-picks?market=us")
        assert resp.status_code == 200
        assert resp.json()["picks"] == []


# ===== /api/stocks/{symbol} =====

class TestStockDetail:
    @patch("routers.stocks.yfinance_service.get_ticker_info", return_value=MOCK_TICKER_INFO)
    @patch("routers.stocks.yfinance_service.get_moving_averages", return_value=MOCK_MA_DATA)
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    @patch("routers.stocks.finnhub_client.get_quote", return_value=MOCK_QUOTE)
    def test_stock_detail_returns_data(self, *_):
        resp = client.get("/api/stocks/AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert data["market"] == "us"

    @patch("routers.stocks.yfinance_service.get_ticker_info", return_value=MOCK_TICKER_INFO)
    @patch("routers.stocks.yfinance_service.get_moving_averages", return_value=MOCK_MA_DATA)
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    @patch("routers.stocks.finnhub_client.get_quote", return_value=MOCK_QUOTE)
    def test_stock_detail_jp_market(self, *_):
        """日本株シンボル(.T)は market=jp"""
        resp = client.get("/api/stocks/7203.T")
        assert resp.status_code == 200
        assert resp.json()["market"] == "jp"

    @patch("routers.stocks.yfinance_service.get_ticker_info", return_value=MOCK_TICKER_INFO)
    @patch("routers.stocks.yfinance_service.get_moving_averages", return_value=MOCK_MA_DATA)
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    @patch("routers.stocks.finnhub_client.get_quote", return_value=MOCK_QUOTE)
    def test_stock_detail_has_score(self, *_):
        """scoreフィールドにtotal/max/breakdownが含まれる"""
        resp = client.get("/api/stocks/AAPL")
        score = resp.json()["score"]
        assert "total" in score
        assert "max" in score
        assert "breakdown" in score
        assert score["max"] == 100

    @patch("routers.stocks.yfinance_service.get_ticker_info", side_effect=Exception("not found"))
    @patch("routers.stocks.yfinance_service.get_moving_averages", side_effect=Exception("not found"))
    @patch("routers.stocks.yfinance_service.get_chart_data", side_effect=Exception("not found"))
    @patch("routers.stocks.finnhub_client.get_quote", side_effect=Exception("not found"))
    def test_stock_detail_returns_404_on_error(self, *_):
        """APIエラー時は404"""
        resp = client.get("/api/stocks/INVALID_SYMBOL_XYZ")
        assert resp.status_code == 404


# ===== /api/stocks/{symbol}/chart =====

class TestStockChart:
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    def test_chart_returns_data(self, _):
        resp = client.get("/api/stocks/AAPL/chart?period=3m")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert data["period"] == "3m"
        assert isinstance(data["data"], list)

    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    def test_chart_data_has_ohlcv(self, _):
        """各ローソク足データにOHLCV + dateが含まれる"""
        resp = client.get("/api/stocks/AAPL/chart?period=1m")
        candles = resp.json()["data"]
        if candles:
            for field in ("date", "open", "high", "low", "close", "volume"):
                assert field in candles[0], f"フィールド '{field}' がない"

    @pytest.mark.parametrize("period", ["1m", "3m", "1y"])
    @patch("routers.stocks.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    def test_chart_valid_periods(self, _, period):
        resp = client.get(f"/api/stocks/AAPL/chart?period={period}")
        assert resp.status_code == 200

    def test_chart_invalid_period(self):
        """不正なperiodは422"""
        resp = client.get("/api/stocks/AAPL/chart?period=5y")
        assert resp.status_code == 422


# ===== /api/news =====

class TestNews:
    @patch("routers.news.finnhub_client.get_news", return_value=MOCK_NEWS)
    def test_news_returns_articles(self, _):
        resp = client.get("/api/news?market=us")
        assert resp.status_code == 200
        data = resp.json()
        assert "articles" in data
        assert isinstance(data["articles"], list)

    @patch("routers.news.finnhub_client.get_news", return_value=MOCK_NEWS)
    def test_news_article_has_required_fields(self, _):
        """各記事に必要フィールドが含まれる"""
        resp = client.get("/api/news?market=us")
        articles = resp.json()["articles"]
        if articles:
            for field in ("id", "headline", "url", "source", "published_at", "market"):
                assert field in articles[0], f"フィールド '{field}' がない"

    @patch("routers.news.finnhub_client.get_news", return_value=MOCK_NEWS)
    def test_news_us_market_label(self, _):
        """market=us のニュースは market='us' になる"""
        resp = client.get("/api/news?market=us")
        articles = resp.json()["articles"]
        for article in articles:
            assert article["market"] == "us"

    def test_news_invalid_market(self):
        resp = client.get("/api/news?market=invalid")
        assert resp.status_code == 422

    @patch("routers.news.finnhub_client.get_news", side_effect=Exception("API error"))
    def test_news_handles_api_error_gracefully(self, _):
        """Finnhub APIエラー時でも200で空リストを返す"""
        resp = client.get("/api/news?market=us")
        assert resp.status_code == 200
        assert resp.json()["articles"] == []


# ===== /api/news/stock/{symbol} =====

class TestStockNews:
    @patch("routers.news.finnhub_client.get_company_news", return_value=MOCK_NEWS)
    def test_stock_news_returns_articles(self, _):
        resp = client.get("/api/news/stock/AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert "articles" in data

    @patch("routers.news.finnhub_client.get_company_news", return_value=MOCK_NEWS)
    def test_stock_news_limit(self, _):
        resp = client.get("/api/news/stock/AAPL?limit=1")
        articles = resp.json()["articles"]
        assert len(articles) <= 1


# ===== /api/market-overview =====

class TestMarketOverview:
    @patch("routers.market.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    def test_market_overview_returns_indices(self, _):
        resp = client.get("/api/market-overview")
        assert resp.status_code == 200
        data = resp.json()
        assert "indices" in data
        indices = data["indices"]
        for key in ("sp500", "nikkei", "nasdaq"):
            assert key in indices

    @patch("routers.market.yfinance_service.get_chart_data", return_value=MOCK_CHART_DATA)
    def test_market_overview_index_fields(self, _):
        """各インデックスにsymbol/price/change_pctが含まれる"""
        resp = client.get("/api/market-overview")
        indices = resp.json()["indices"]
        for name, idx in indices.items():
            assert "symbol" in idx, f"{name} に symbol がない"
            assert "price" in idx, f"{name} に price がない"
            assert "change_pct" in idx, f"{name} に change_pct がない"

    @patch("routers.market.yfinance_service.get_chart_data", side_effect=Exception("API error"))
    def test_market_overview_handles_errors(self, _):
        """一部インデックスのAPIエラーでも200で返す"""
        resp = client.get("/api/market-overview")
        assert resp.status_code == 200
        indices = resp.json()["indices"]
        # エラー時はprice=Noneで返る
        for idx in indices.values():
            assert idx["price"] is None
