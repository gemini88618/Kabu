# 株価予測PWA - システム設計書

## 1. プロジェクト概要

**プロジェクト名**: 株価予測PWA (Stock Price Prediction PWA)

**目的**: 独自アルゴリズムで「1週間以内に+10%以上上昇する確率」を算出し、日本株・米国株の将来性を予測するPWAアプリケーション

**対応プラットフォーム**: 
- iPhone Safari (PWAとしてホーム画面に追加可能)
- その他のモダンブラウザ

---

## 2. システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    ユーザーデバイス(iPhone)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PWA フロントエンド                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  UI Layer (React + TypeScript)                 │  │   │
│  │  │  - 複数期間切り替え表示（週間/月間/半年間）     │  │   │
│  │  │  - トップ10銘柄リスト                           │  │   │
│  │  │  - 係数調整UI                                   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  State Management (Zustand/Redux)              │  │   │
│  │  │  - ユーザー設定(係数)                           │  │   │
│  │  │  - キャッシュデータ                             │  │   │
│  │  │  - UI状態管理                                   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Local Storage / IndexedDB                      │  │   │
│  │  │  - オフライン対応データ                         │  │   │
│  │  │  - Service Worker キャッシュ                   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS/REST API
┌─────────────────────────────────────────────────────────────┐
│                   バックエンドサーバー                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Layer (Node.js/Python)             │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Express/FastAPI REST API                       │  │   │
│  │  │  - GET /api/stocks/predictions                  │  │   │
│  │  │  - GET /api/stocks/historical                   │  │   │
│  │  │  - POST /api/algorithm/test (係数テスト)        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Business Logic Layer                          │  │   │
│  │  │  - データ取得・キャッシング                     │  │   │
│  │  │  - 予測アルゴリズム計算                         │  │   │
│  │  │  - データ加工・変換                             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Database Layer (PostgreSQL)                    │  │   │
│  │  │  - 株価データ (日次)                            │  │   │
│  │  │  - 財務データ (四半期/年次)                     │  │   │
│  │  │  - テクニカル指標 (計算結果キャッシュ)         │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              ↓ 外部API呼び出し              ↓ 定期実行
┌──────────────────────────┬──────────────────────────────────┐
│  データソース               │    データ処理・更新                │
├──────────────────────────┼──────────────────────────────────┤
│ • Alpha Vantage          │ • Python バッチ処理              │
│ • FINNHUB                │   - 日次データ取得・更新          │
│ • yfinance/pandas-datareader │ - 指標計算                    │
│ • Financial Modeling Prep │ - 予測実行                      │
│ • Japan Stock Data APIs   │                                 │
│   (日本取引所/iFinance等)  │                                 │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 3. 使用技術スタック

### フロントエンド
| 分類 | 技術 | 理由 |
|-----|-----|------|
| フレームワーク | **Next.js 14** | SSG/ISR対応、PWA化容易、TypeScript統合 |
| UI フレームワーク | **React 18** | Next.jsに統合、コンポーネント再利用性 |
| 言語 | **TypeScript** | 型安全性、IDE補完、保守性向上 |
| スタイリング | **Tailwind CSS** | ユーティリティファースト、モバイル対応 |
| 状態管理 | **Zustand** | シンプル、バンドルサイズ小、PWA向け |
| HTTP Client | **SWR / TanStack Query** | キャッシング、リアルタイム更新対応 |
| PWA対応 | **next-pwa** | Service Worker、マニフェスト自動生成 |
| グラフ表示 | **Chart.js / Recharts** | インタラクティブ、軽量 |
| オフライン | **Workbox / Service Worker** | キャッシング戦略、同期処理 |

### バックエンド
| 分類 | 技術 | 理由 |
|-----|-----|------|
| ランタイム | **Node.js 20 + Express** | JavaScript統一、コミュニティ広い |
| 言語 | **TypeScript** | フロントと同じ言語で統一 |
| API フレームワーク | **Express** または **FastAPI (Python)** | Express: JS統一 / FastAPI: AI・数値計算が得意 |
| データベース | **PostgreSQL 15+** | JSONB対応、パフォーマンス良好 |
| ORM | **Prisma** (Node) / **SQLAlchemy** (Python) | スキーマ定義が簡潔 |
| キャッシュ | **Redis** | インメモリ、セッション、計算結果キャッシュ |
| タスクスケジューラ | **node-cron** / **APScheduler** | 日次バッチ定期実行 |
| ログ・モニタリング | **Winston / Bunyan** (Node) / **logging** (Python) | デバッグ・本番対応 |

### データ処理 (Python)
| 分類 | 技術 | 理由 |
|-----|-----|------|
| データ分析 | **pandas** | 時系列データ・指標計算に最適 |
| 数値計算 | **NumPy** | 高速計算、行列演算 |
| 統計分析 | **SciPy** | 統計検定、移動平均等 |
| 機械学習 | **scikit-learn** | 確率計算・予測モデル |
| グラフ処理 | **matplotlib** (オプション) | データ検証・可視化 |
| DB接続 | **psycopg2 / SQLAlchemy** | PostgreSQL接続 |

### インフラ・デプロイ
| 分類 | 技術 | 理由 |
|-----|-----|------|
| ホスティング | **Vercel** (フロント) / **Heroku** or **Railway** (バック) | 手軽、スケーリング容易 |
| データベース | **Vercel Postgres** / **AWS RDS** | マネージドサービス |
| キャッシュ | **Vercel KV** / **Redis Cloud** | マネージド、初期設定簡単 |
| CI/CD | **GitHub Actions** | GitHub統合、無料 |
| コンテナ化 | **Docker** | 環境統一、本番環境再現 |

---

## 3.5 期間定義

アプリケーションは3つの時間単位で複数の期間を提供します。各期間で過去の実績値と未来の予測値を表示します。

### 週間単位 (Weekly)

| Period ID | 期間 | 型 | 説明 |
|-----------|------|-----|------|
| `past-3w-2w` | 3週間前 → 2週間前 | 実績 | 過去3週間のパフォーマンス振り返り |
| `past-2w-1w` | 2週間前 → 1週間前 | 実績 | 過去2週間のパフォーマンス振り返り |
| `past-1w-now` | 1週間前 → 現在 | 実績 | 直近1週間の実績 |
| `now-1w-future` | 現在 → 1週間後 | 予測 | **デフォルト予測対象** |

### 月間単位 (Monthly)

| Period ID | 期間 | 型 | 説明 |
|-----------|------|-----|------|
| `past-3m-2m` | 3ヶ月前 → 2ヶ月前 | 実績 | 過去3ヶ月のパフォーマンス振り返り |
| `past-2m-1m` | 2ヶ月前 → 1ヶ月前 | 実績 | 過去2ヶ月のパフォーマンス振り返り |
| `past-1m-now` | 1ヶ月前 → 現在 | 実績 | 直近1ヶ月の実績 |
| `now-1m-future` | 現在 → 1ヶ月後 | 予測 | 中期予測（約4週間） |

### 半年単位 (Half-yearly)

| Period ID | 期間 | 型 | 説明 |
|-----------|------|-----|------|
| `past-1y-6m` | 1年前 → 6ヶ月前 | 実績 | 過去1年のパフォーマンス振り返り |
| `past-6m-now` | 6ヶ月前 → 現在 | 実績 | 直近6ヶ月の実績 |
| `now-6m-future` | 現在 → 6ヶ月後 | 予測 | 長期予測（約26週間） |

### UIでの表示

**タブ構成**:
```
┌─────────────────────────────────────────────┐
│  Weekly  │  Monthly  │  Half-yearly          │  ← 期間タイプ選択
└─────────────────────────────────────────────┘
        ↓ 選択された期間タイプの詳細
┌─────────────────────────────────────────────┐
│  [Past 3w→2w] [Past 2w→1w]                  │
│  [Past 1w→Now] [Now→1w Future]              │  ← 週間単位の場合
│                                             │
│  [Show Results] → トップ10銘柄表示          │
└─────────────────────────────────────────────┘
```

### アルゴリズムの調整

各期間での予測精度向上のため、アルゴリズムは期間に応じた係数調整が可能：

- **週間予測**: テクニカル分析の重み重視 (テクニカル 70% + ファンダメンタルズ 30%)
- **月間予測**: バランス型 (テクニカル 60% + ファンダメンタルズ 40%)
- **半年予測**: ファンダメンタルズ重視 (テクニカル 40% + ファンダメンタルズ 60%)

---

## 4. データ取得方法 (API)

### 4.1 株価データ取得

#### 日本株
```
優先順位1: iFinance API (無料、リアルタイム対応)
優先順位2: yfinance (Yahoo Finance経由、手軽)
優先順位3: 日本取引所グループ (JSON API) - 月次提供

エンドポイント:
- 日次株価: GET https://api.ifinance.jp/stocks/{ticker}/daily
- 企業情報: GET https://api.ifinance.jp/stocks/{ticker}/info

パラメータ:
- ticker: 証券コード (例: 7203 = トヨタ)
- from, to: 期間指定
```

#### 米国株
```
優先順位1: FINNHUB API (無料枠: 60リクエスト/分)
優先順位2: Alpha Vantage (無料枠: 5リクエスト/分)
優先順位3: yfinance (安定、日本株と同じ)

エンドポイント:
- 日次株価: https://finnhub.io/api/v1/quote?symbol=AAPL
- 企業情報: https://finnhub.io/api/v1/stock/profile2?symbol=AAPL

パラメータ:
- symbol: ティッカー (例: AAPL)
- token: APIキー
```

### 4.2 財務データ取得

#### 日本株
```
プロバイダー: iFinance / 日経テレコン (連携確認必要)

指標:
- PER (株価収益率)
- PBR (株価純資産倍率)
- ROE (自己資本利益率)
- 売上成長率

取得頻度: 四半期/年次 (2か月遅延が一般的)
```

#### 米国株
```
プロバイダー: FINNHUB / Financial Modeling Prep

エンドポイント:
- 四季報: https://finnhub.io/api/v1/stock/earnings?symbol=AAPL
- 財務指標: https://api.financialmodellingprep.com/api/v3/ratios/{symbol}

指標:
- PER, PBR, ROE: リアルタイム取得可能
- 売上成長率: 年次・四半期データ

取得頻度: リアルタイム
```

### 4.3 テクニカル指標用データ

```
取得元: yfinance / FINNHUB

必要なデータ:
- 終値 (Close): 移動平均線計算用
- 出来高 (Volume): トレンド判定用
- 高値・安値: ボラティリティ計算用
- 日付: 時系列データ

取得頻度: 日次 (営業日のみ)
```

### 4.4 API呼び出し戦略

```
キャッシング:
- 株価: 1日 (営業日を考慮)
- 財務: 7日 (更新頻度低い)
- テクニカル: 1日

バッチ処理タイミング:
- 日本株: 15:15 (市場終了後)
- 米国株: 21:00 JST (市場終了後)
- 定期実行: APScheduler / node-cron で自動化

レート制限対策:
- キューイング (BullMQ / RabbitMQ)
- API呼び出し分散
- フォールバック API用意
```

---

## 5. データベース設計

### 5.1 テーブル構成

```sql
-- 銘柄マスタ
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,           -- AAPL, 7203
  name VARCHAR(255) NOT NULL,                    -- Apple Inc., トヨタ自動車
  market VARCHAR(10) NOT NULL,                   -- JPX, NYSE
  sector VARCHAR(100),                           -- Technology, Automotive
  industry VARCHAR(100),
  country VARCHAR(10) NOT NULL,                  -- JP, US
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日次株価データ
CREATE TABLE daily_prices (
  id BIGSERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  date DATE NOT NULL,
  open DECIMAL(10, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  close DECIMAL(10, 2) NOT NULL,
  volume BIGINT,
  adjusted_close DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, date)
);
CREATE INDEX idx_daily_prices_stock_date ON daily_prices(stock_id, date DESC);

-- 財務データ (四半期/年次)
CREATE TABLE financial_data (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  period_date DATE NOT NULL,                      -- レポート日
  period_type VARCHAR(10) NOT NULL,               -- Q1, Q2, Q3, Q4, FY
  per DECIMAL(8, 2),                              -- PER (Price-to-Earnings Ratio)
  pbr DECIMAL(8, 2),                              -- PBR (Price-to-Book Ratio)
  roe DECIMAL(8, 2),                              -- ROE (Return on Equity) %
  revenue BIGINT,                                 -- 売上 (円/ドル)
  net_income BIGINT,                              -- 純利益
  operating_cash_flow BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, period_date, period_type)
);
CREATE INDEX idx_financial_data_stock_period ON financial_data(stock_id, period_date DESC);

-- テクニカル指標 (日次計算結果キャッシュ)
CREATE TABLE technical_indicators (
  id BIGSERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  date DATE NOT NULL,
  sma_5 DECIMAL(10, 4),                          -- 5日移動平均
  sma_25 DECIMAL(10, 4),                         -- 25日移動平均
  momentum DECIMAL(10, 4),                        -- モメンタム (ROC)
  volume_avg_20 BIGINT,                           -- 20日平均出来高
  rsi_14 DECIMAL(5, 2),                          -- RSI (オプション)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, date)
);
CREATE INDEX idx_technical_indicators_stock_date ON technical_indicators(stock_id, date DESC);

-- 売上成長率計算テーブル
CREATE TABLE revenue_growth (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  fiscal_year INTEGER NOT NULL,
  revenue_growth_rate DECIMAL(8, 4),              -- %
  yoy_growth DECIMAL(8, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, fiscal_year)
);

-- 予測結果キャッシュ
CREATE TABLE prediction_results (
  id BIGSERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES stocks(id),
  prediction_date DATE NOT NULL,                  -- 予測実行日
  period_start DATE NOT NULL,                     -- 予測対象期間開始
  period_end DATE NOT NULL,                       -- 予測対象期間終了 (通常+7日)
  predicted_probability DECIMAL(5, 2),            -- 10%上昇確率 (%)
  predicted_return DECIMAL(8, 2),                 -- 予測上昇率 (%)
  algorithm_version VARCHAR(50),
  coefficients JSONB,                             -- 使用した係数をJSON保存
  actual_return DECIMAL(8, 2),                    -- 実績値 (期間終了後に記録)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, prediction_date, period_start, period_end)
);
CREATE INDEX idx_prediction_results_stock_date ON prediction_results(stock_id, prediction_date DESC);

-- ユーザー設定 (係数カスタマイズ)
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100),                           -- PWAの場合、デバイスID / クッキー
  algorithm_coefficients JSONB NOT NULL,          -- カスタム係数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- アルゴリズムバージョン管理
CREATE TABLE algorithm_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) UNIQUE NOT NULL,
  coefficients JSONB NOT NULL,                    -- デフォルト係数
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 ER図

```
stocks (銘柄)
  ├─ daily_prices (日次株価)
  ├─ financial_data (財務データ)
  ├─ technical_indicators (テクニカル指標)
  ├─ revenue_growth (売上成長率)
  └─ prediction_results (予測結果)

user_settings (ユーザー設定)
algorithm_versions (アルゴリズムバージョン)
```

### 5.3 パフォーマンス最適化

```sql
-- インデックス戦略
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
CREATE INDEX idx_stocks_market ON stocks(market);

-- パーティショニング (大規模データの場合)
-- daily_prices を date で月ごとパーティション
-- prediction_results を prediction_date で月ごとパーティション

-- クエリ最適化
-- N+1問題回避: 銘柄とテクニカル指標は JOIN で一度に取得
SELECT d.*, ti.*, f.* 
FROM daily_prices d
LEFT JOIN technical_indicators ti ON d.stock_id = ti.stock_id AND d.date = ti.date
LEFT JOIN financial_data f ON d.stock_id = f.stock_id
WHERE d.stock_id = ? AND d.date >= ?;
```

---

## 6. ディレクトリ構成

```
stock-prediction-pwa/
│
├── frontend/                          # Next.js フロントエンド
│   ├── public/
│   │   ├── manifest.json              # PWAマニフェスト
│   │   ├── icon-192.png               # PWAアイコン
│   │   ├── icon-512.png
│   │   └── offline.html               # オフラインページ
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # ルートレイアウト
│   │   │   ├── page.tsx               # ホームページ
│   │   │   ├── predictions/
│   │   │   │   └── [period]/page.tsx  # 期間別予測ページ
│   │   │   ├── settings/
│   │   │   │   └── page.tsx           # 係数設定ページ
│   │   │   └── api/
│   │   │       └── (NextJS API Routes)
│   │   │
│   │   ├── components/
│   │   │   ├── StockCard.tsx          # 銘柄カード
│   │   │   ├── PeriodSelector.tsx     # 期間切り替え
│   │   │   ├── StockChart.tsx         # チャート表示
│   │   │   ├── CoefficientForm.tsx    # 係数調整フォーム
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── Common/
│   │   │       ├── Loading.tsx
│   │   │       ├── Error.tsx
│   │   │       └── NotFound.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── usePredictions.ts      # 予測データ取得
│   │   │   ├── useSettings.ts         # ユーザー設定管理
│   │   │   └── useOffline.ts          # オフライン状態判定
│   │   │
│   │   ├── stores/
│   │   │   ├── predictionStore.ts     # Zustand: 予測データ
│   │   │   ├── settingsStore.ts       # Zustand: 係数設定
│   │   │   └── uiStore.ts             # Zustand: UI状態
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts                 # API通信
│   │   │   ├── storage.ts             # IndexedDB操作
│   │   │   └── crypto.ts              # 暗号化・復号化 (オプション)
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.ts          # 数値・日付フォーマッタ
│   │   │   ├── validators.ts          # バリデーション
│   │   │   ├── calculations.ts        # クライアント側計算
│   │   │   └── constants.ts           # 定数
│   │   │
│   │   └── styles/
│   │       ├── globals.css
│   │       └── tailwind.config.ts
│   │
│   ├── next.config.js                 # Next.js設定
│   ├── next-pwa.config.js             # PWA設定
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.local                     # 環境変数
│
├── backend/                           # Node.js/Express バックエンド
│   ├── src/
│   │   ├── index.ts                   # エントリーポイント
│   │   ├── config/
│   │   │   ├── database.ts            # DB接続設定
│   │   │   ├── redis.ts               # キャッシュ設定
│   │   │   ├── env.ts                 # 環境変数
│   │   │   └── logger.ts              # ログ設定
│   │   │
│   │   ├── routes/
│   │   │   ├── stocks.ts              # /api/stocks
│   │   │   ├── predictions.ts         # /api/predictions
│   │   │   ├── technical.ts           # /api/technical
│   │   │   ├── settings.ts            # /api/settings
│   │   │   └── health.ts              # /health
│   │   │
│   │   ├── controllers/
│   │   │   ├── stockController.ts
│   │   │   ├── predictionController.ts
│   │   │   ├── technicalController.ts
│   │   │   └── settingsController.ts
│   │   │
│   │   ├── services/
│   │   │   ├── stockService.ts        # 銘柄データ管理
│   │   │   ├── priceService.ts        # 株価データ管理
│   │   │   ├── financialService.ts    # 財務データ管理
│   │   │   ├── predictionService.ts   # 予測エンジン
│   │   │   ├── technicalService.ts    # テクニカル指標
│   │   │   └── cacheService.ts        # キャッシング
│   │   │
│   │   ├── repositories/
│   │   │   ├── stockRepository.ts
│   │   │   ├── priceRepository.ts
│   │   │   ├── financialRepository.ts
│   │   │   ├── predictionRepository.ts
│   │   │   └── technicalRepository.ts
│   │   │
│   │   ├── models/
│   │   │   ├── Stock.ts
│   │   │   ├── DailyPrice.ts
│   │   │   ├── FinancialData.ts
│   │   │   ├── Prediction.ts
│   │   │   └── types.ts               # 型定義
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                # 認証 (オプション)
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts           # レート制限
│   │   │   └── cors.ts
│   │   │
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── helpers.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma              # DBスキーマ定義
│   │   └── migrations/
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   │
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── .env.local                     # 環境変数
│
├── data-processor/                    # Python データ処理・バッチ
│   ├── src/
│   │   ├── main.py                    # エントリーポイント
│   │   ├── config.py                  # 設定
│   │   ├── logger.py                  # ログ設定
│   │   │
│   │   ├── data_fetchers/
│   │   │   ├── __init__.py
│   │   │   ├── base_fetcher.py        # 基底クラス
│   │   │   ├── japan_stock_fetcher.py # 日本株データ取得
│   │   │   ├── us_stock_fetcher.py    # 米国株データ取得
│   │   │   └── financial_fetcher.py   # 財務データ取得
│   │   │
│   │   ├── indicators/
│   │   │   ├── __init__.py
│   │   │   ├── technical_indicators.py # テクニカル指標計算
│   │   │   ├── momentum.py             # モメンタム
│   │   │   ├── moving_average.py       # 移動平均線
│   │   │   └── volume_analysis.py      # 出来高分析
│   │   │
│   │   ├── algorithms/
│   │   │   ├── __init__.py
│   │   │   ├── base_algorithm.py       # 予測アルゴリズム基底
│   │   │   ├── v1_algorithm.py         # v1 予測モデル
│   │   │   ├── v2_algorithm.py         # v2 予測モデル (ML)
│   │   │   └── coefficients.py         # 係数管理
│   │   │
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── connection.py           # DB接続
│   │   │   ├── queries.py              # SQL実行
│   │   │   └── models.py               # SQLAlchemy モデル
│   │   │
│   │   ├── batch_jobs/
│   │   │   ├── __init__.py
│   │   │   ├── daily_update.py         # 日次データ更新
│   │   │   ├── compute_indicators.py   # 指標計算
│   │   │   ├── run_predictions.py      # 予測実行
│   │   │   └── scheduler.py            # スケジューラ
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── validation.py
│   │       └── formatters.py
│   │
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   │
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   │
│   ├── requirements.txt                # Python依存関係
│   ├── config.yaml                     # 設定ファイル
│   ├── .env.example
│   └── .env.local                      # 環境変数
│
├── shared/                            # 共有コード
│   ├── types/
│   │   ├── stock.ts                   # 銘柄型定義
│   │   ├── prediction.ts              # 予測型定義
│   │   └── api.ts                     # API型定義
│   │
│   └── constants/
│       ├── markets.ts                 # 市場定数
│       └── algorithms.ts              # アルゴリズム定数
│
├── docs/
│   ├── ARCHITECTURE.md                # アーキテクチャ詳細
│   ├── API.md                         # API仕様書
│   ├── ALGORITHM.md                   # アルゴリズム詳細
│   ├── DEPLOYMENT.md                  # デプロイメントガイド
│   └── DEVELOPMENT.md                 # 開発ガイド
│
├── .github/
│   └── workflows/
│       ├── test-frontend.yml
│       ├── test-backend.yml
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
│
├── docker-compose.yml                 # 本番環境 Docker構成
├── .gitignore
├── README.md
└── SYSTEM_DESIGN.md                   # このファイル
```

---

## 7. データフロー図

### 7.1 データ取得フロー

```
┌─────────────────┐
│  外部API        │
│  - iFinance     │
│  - FINNHUB      │
│  - yfinance     │
└────────┬────────┘
         │
         ↓ (定期実行: 日次バッチ)
┌──────────────────────┐
│  Python Batch Processor
│  (data-processor/)    │
│  ・API呼び出し       │
│  ・データ整形         │
│  ・指標計算           │
└────────┬─────────────┘
         │
         ↓ INSERT/UPDATE
┌──────────────────────┐
│  PostgreSQL Database │
│  ・daily_prices      │
│  ・technical_indicators
│  ・financial_data    │
└─────────┬────────────┘
          │
          ↓ キャッシュ更新
┌──────────────────────┐
│  Redis Cache         │
│  (1日TTL)            │
└──────────────────────┘
```

### 7.2 予測フロー

```
┌──────────────────────────────┐
│  フロントエンド (ユーザー)     │
│  ・期間選択                   │
│  ・係数調整                   │
└────────────┬─────────────────┘
             │
             ↓ POST /api/predictions/calculate
┌──────────────────────────────────┐
│  バックエンド API               │
│  (predictionController)         │
│  ・入力値検証                   │
│  ・キャッシュ確認               │
└────────────┬────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  predictionService               │
│  ・テクニカル指標取得             │
│  ・財務データ取得                 │
│  ・複合指数計算                   │
└────────────┬────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  Python バッチ / Node.js          │
│  (v1_algorithm.py / algorithm.ts) │
│  ・係数適用                       │
│  ・確率計算                       │
│  ・スコアリング                   │
└────────────┬────────────────────┘
             │
             ↓ キャッシュ保存
┌──────────────────────────────────┐
│  Redis / prediction_results      │
│  テーブル                         │
└────────────┬────────────────────┘
             │
             ↓ JSON形式で返却
┌──────────────────────────────────┐
│  フロントエンド (ユーザー表示)    │
│  ・トップ10銘柄表示              │
│  ・チャート表示                   │
└──────────────────────────────────┘
```

---

## 8. 予測アルゴリズム概要

### 8.1 構成要素

```
総合スコア = (重み1 × テクニカルスコア) + (重み2 × ファンダメンタルズスコア)

テクニカルスコア = 
  - 移動平均線クロス (SMA_5 > SMA_25: +1.0)
  - モメンタム (正: +0.5)
  - 出来高 (平均比: +0.3)

ファンダメンタルズスコア =
  - PER評価 (低い: +0.5)
  - PBR評価 (低い: +0.3)
  - ROE評価 (高い: +0.4)
  - 売上成長率 (高い: +0.3)

上昇確率(%) = シグモイド(総合スコア) × 100
予測上昇率(%) = 総合スコア × 係数
```

### 8.2 デフォルト係数

```json
{
  "version": "v1",
  "weights": {
    "technical_weight": 0.6,
    "fundamental_weight": 0.4
  },
  "technical": {
    "sma_cross_weight": 0.4,
    "momentum_weight": 0.3,
    "volume_weight": 0.3
  },
  "fundamental": {
    "per_weight": 0.25,
    "pbr_weight": 0.15,
    "roe_weight": 0.35,
    "revenue_growth_weight": 0.25
  },
  "sigmoid_scale": 15.0
}
```

---

## 9. デプロイメント構成

### 9.1 開発環境

```bash
# ローカル実行
docker-compose -f docker-compose.yml up

# コンポーネント:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - バックエンド: localhost:3001
# - フロントエンド: localhost:3000
```

### 9.2 本番環境

```
フロントエンド:
├─ Vercel
│  ├─ Next.js アプリケーション
│  ├─ Service Worker + PWA キャッシング
│  └─ CDN配信 (エッジロケーション)

バックエンド:
├─ Railway / Heroku / AWS
│  ├─ Node.js + Express API
│  ├─ オートスケーリング
│  └─ ヘルスチェック監視

データベース:
├─ AWS RDS / Vercel Postgres
│  ├─ PostgreSQL 15+
│  ├─ 自動バックアップ
│  └─ レプリケーション

キャッシュ:
├─ Vercel KV / Redis Cloud
│  ├─ インメモリキャッシング
│  └─ セッション管理

バッチ処理:
├─ AWS Lambda / Railway Cron
│  ├─ 日次データ取得
│  ├─ 指標計算
│  └─ 予測実行

CI/CD:
├─ GitHub Actions
│  ├─ テスト自動実行
│  ├─ ビルド
│  └─ 自動デプロイ
```

---

## 10. セキュリティ考慮事項

```
1. API キー管理
   - 環境変数で管理
   - .env.local をGitから除外
   - Vercel Secrets で管理

2. リクエスト認証
   - API キー検証
   - レート制限実装
   - CORS設定

3. データ保護
   - HTTPS通信
   - CSP (Content Security Policy)
   - CSRF対策

4. プライバシー
   - ローカルストレージ暗号化 (オプション)
   - クッキーセキュア設定
   - 個人情報最小化

5. インフラセキュリティ
   - VPC隔離
   - ファイアウォール設定
   - 定期セキュリティ監査
```

---

## 11. 実装ロードマップ

### Phase 1: MVP (4週間)
- [ ] フロント基本UI (期間表示、リスト表示)
- [ ] バック API (GET /predictions)
- [ ] DB構築 (PostgreSQL スキーマ)
- [ ] 日本株データ取得 (yfinance)
- [ ] v1 アルゴリズム実装

### Phase 2: 拡張 (3週間)
- [ ] 米国株対応
- [ ] テクニカル指標計算
- [ ] 係数カスタマイズUI
- [ ] キャッシング最適化
- [ ] パフォーマンスチューニング

### Phase 3: PWA・本番化 (2週間)
- [ ] Service Worker実装
- [ ] オフライン対応
- [ ] Vercel デプロイ
- [ ] 監視・アラート設定
- [ ] セキュリティ監査

---

## 12. 参考資料・リンク

### API ドキュメント
- [Alpha Vantage API](https://www.alphavantage.co/documentation/)
- [FINNHUB API](https://finnhub.io/docs/api)
- [iFinance API](https://ifinance.jp/) (日本)
- [yfinance GitHub](https://github.com/ranaroussi/yfinance)

### フレームワーク
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Prisma ORM](https://www.prisma.io/)
- [Express.js](https://expressjs.com/)
- [FastAPI](https://fastapi.tiangolo.com/)

### PWA
- [next-pwa](https://github.com/shadowwalker/next-pwa)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)

### 指標計算
- [TA-Lib](https://mrjbq7.github.io/ta-lib/) (Python)
- [pandas-ta](https://github.com/twopirllc/pandas-ta) (軽量版)

---

## まとめ

このシステム設計は、以下を実現します：

✅ **iPhoneのSafariで動作するPWA** - Service Worker + manifest.json対応
✅ **スケーラブルなアーキテクチャ** - マイクロサービス的な層分離
✅ **複数データソース対応** - 日本株・米国株の両方に対応
✅ **カスタマイズ可能なアルゴリズム** - ユーザー係数調整
✅ **高パフォーマンス** - キャッシング戦略とDB最適化
✅ **保守性** - TypeScript, 層分離, テスト対応

推奨スタック：
- フロント: **Next.js + TypeScript + Tailwind CSS + Zustand**
- バック: **Node.js/Express + TypeScript** (または **Python/FastAPI**)
- DB: **PostgreSQL + Redis**
- デプロイ: **Vercel (フロント) + Railway/Heroku (バック)**
