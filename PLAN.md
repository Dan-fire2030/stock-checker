# Plan: Stock Checker App (株式チェッカー)

## Context

個人用の株式スクリーニング・チェックアプリを一から作成する。
完全無料（バックエンドはRender無料枠）で、iOS・Android・PCのクロスプラットフォーム対応。
日本株・米国株の銘柄フィルタリング、ニュース取得、ルールベースのスコアリングによる推薦機能を実装する。

---

## Tech Stack

| 役割 | 技術 |
|------|------|
| Frontend | Expo (React Native) + React Native Web |
| Navigation | Expo Router (ファイルベース) |
| State管理 | Zustand |
| チャート | Victory Native |
| Backend | Python FastAPI |
| Hosting (Backend) | Render (無料枠) |
| ローカルDB | AsyncStorage (ウォッチリスト) |
| 株価API | Finnhub (60req/min無料) + yfinance |
| 日本株 | J-Quants API (無料、12週遅延) |
| ニュース | Finnhub News + MarketAux |

**コスト: 完全無料**（APIキーの無料枠内）

---

## Project Structure

```
stock_checker/
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx         # ダッシュボード (トップ銘柄, 市場概況)
│   │   │   ├── search.tsx        # 銘柄検索・フィルタリング
│   │   │   ├── watchlist.tsx     # マイウォッチリスト
│   │   │   └── news.tsx          # マーケットニュース
│   │   └── stock/[symbol].tsx    # 銘柄詳細 (チャート・スコア)
│   ├── components/
│   │   ├── StockCard.tsx         # 銘柄カード
│   │   ├── ScoreBar.tsx          # スコア表示バー
│   │   ├── NewsItem.tsx          # ニュースアイテム
│   │   └── MarketOverview.tsx    # 市場概況ヘッダー
│   ├── store/
│   │   ├── watchlistStore.ts     # ウォッチリスト (Zustand + AsyncStorage)
│   │   └── marketStore.ts        # 市場データキャッシュ
│   ├── services/
│   │   └── api.ts                # バックエンドAPIクライアント
│   ├── hooks/
│   │   ├── useStock.ts           # 銘柄データフック
│   │   └── useNews.ts            # ニュースフック
│   └── package.json
└── backend/
    ├── main.py                   # FastAPI エントリーポイント
    ├── routers/
    │   ├── stocks.py             # 銘柄データエンドポイント
    │   ├── news.py               # ニュースエンドポイント
    │   └── screener.py           # スクリーニング・スコアリング
    ├── services/
    │   ├── finnhub_client.py     # Finnhub APIラッパー
    │   ├── yfinance_service.py   # yfinanceラッパー (日米株)
    │   ├── jquants_client.py     # J-Quants APIラッパー
    │   └── screener.py           # ルールベーススコアリングロジック
    ├── requirements.txt
    └── render.yaml               # Renderデプロイ設定
```

---

## Backend API Endpoints

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/market-overview` | Nikkei225, S&P500, TOPIX概況 |
| GET | `/api/stocks/search?q={query}&market={jp\|us\|all}` | 銘柄検索 |
| GET | `/api/stocks/{symbol}` | 銘柄詳細 + スコア |
| GET | `/api/stocks/{symbol}/chart?period={1m\|3m\|1y}` | チャートデータ |
| GET | `/api/stocks/top-picks?market={jp\|us}&limit=20` | 上位スコア銘柄 |
| GET | `/api/news?market={jp\|us\|all}&limit=30` | 最新ニュース |

---

## ルールベーススコアリング (0〜100点)

各銘柄を以下の指標で採点し合算する:

**テクニカル指標 (50点満点)**
- RSI (30-70適正範囲) → 20点
- MA50 > MA200 (ゴールデンクロス) → 15点
- 出来高トレンド (増加傾向) → 15点

**ファンダメンタル指標 (50点満点)**
- PER (業種平均以下) → 20点
- PBR (1.0以下 or 業種比較) → 15点
- ROE (10%以上) → 15点

---

## 実装フェーズ

### ✅ Phase 1: バックエンド基盤 (完了 2026-03-11)
1. Python環境セットアップ (uv + FastAPI)
2. Finnhub・yfinanceクライアント実装
3. 市場概況・銘柄検索・チャートAPIを実装
4. ルールベーススコアリングロジック実装
5. Renderデプロイ設定 (render.yaml)

### ✅ Phase 2: フロントエンド基盤 (完了 2026-03-11)
1. Expo初期化 (`npx create-expo-app`)
2. Expo Router + タブナビゲーション設定
3. Zustandストア (ウォッチリスト + キャッシュ)
4. バックエンドAPIクライアント (api.ts)
5. 全タブ画面・コンポーネント実装 (StockCard, ScoreBar, NewsItem, MarketOverview)
6. 銘柄詳細画面実装 (スコア・テクニカル・ファンダメンタル表示)

### ✅ Phase 3: 主要画面改善 (完了 2026-03-12)
1. SVGラインチャート実装 (StockChart.tsx, react-native-svg使用)
2. 銘柄詳細画面にチャート組み込み
3. newsのRefresh Control修正 (useNewsにrefetch追加)

### ✅ Phase 4: ニュース統合 (完了 2026-03-12)
1. 銘柄詳細画面に関連ニュース表示 (useStockNews + NewsItem)

### 🔄 Phase 5: デプロイ・仕上げ (進行中)
1. ✅ バックエンドをRenderにデプロイ (https://stock-checker-i80s.onrender.com)
2. ✅ GitHubリポジトリ作成 (Dan-fire2030/stock-checker)
3. ✅ フロントのAPIURL本番に更新
4. 🔲 cron-job.org でRenderスリープ防止 (無料pingサービス)
5. 🔲 iPhoneネイティブ対応 (EAS Build or Expo SDK互換待ち)

---

## 無料API取得手順

以下のAPIキーが必要（登録無料）:
- **Finnhub**: https://finnhub.io/ → 無料登録でAPIキー取得
- **MarketAux**: https://www.marketaux.com/ → 無料登録
- **J-Quants**: https://jpx-jquants.com/ → 無料プラン登録

環境変数 (.env):
```
FINNHUB_API_KEY=xxx
MARKETAUX_API_KEY=xxx
JQUANTS_REFRESH_TOKEN=xxx
```

---

## 検証方法

1. バックエンド: `uvicorn main:app --reload` → `http://localhost:8000/docs` でSwagger UI確認
2. フロントエンド: `npx expo start` → ブラウザ・iOS Simulator・Androidエミュレータで確認
3. 銘柄検索: `7203.T` (トヨタ), `AAPL` (Apple) でデータ取得確認
4. スコアリング: `/api/stocks/top-picks?market=jp` で日本株ランキング確認
5. Renderデプロイ: Push後に自動ビルド → エンドポイントで動作確認

---

## 注意事項

- yfinanceは非公式Yahoo Finance APIのため、稀にレート制限あり → 結果をキャッシュ (TTL: 15分)
- J-Quantsの無料枠は12週遅延データのみ → 日本株のリアルタイム価格はFinnhubを使用
- Renderの無料Webサービスは15分非アクティブでスリープ → cron-job.orgで定期Pingを設定
