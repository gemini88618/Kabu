# 📈 Stock Scanner - AI 駆動の株価予測システム

多期間の株価上昇確率を予測する本格的なフルスタック PWA アプリケーション。

## 🎯 機能

### コア予測エンジン
- **3 期間対応**: 1 週間（+10%）、1 ヶ月（+15%）、6 ヶ月（+30%）の上昇確率を予測
- **ハイブリッドアルゴリズム**: モメンタム + バリュエーション分析
- **複数市場**: 日本株（JPX）と米国株（NYSE）に対応
- **カスタマイズ可能**: 7 つの係数をスライダーで調整可能

### 技術指標
- **モメンタム**: 直近リターン、SMA クロス、出来高
- **バリュエーション**: PER、PBR、ROE、収益成長率

### PWA 対応
- オフライン動作対応
- ホーム画面インストール
- iOS サポート
- プッシュ通知対応

### バックテスト
- 歴史的データでのモデル検証
- ヒット率、Sharpe レシオ、最大ドローダウンの計測
- シグナルの追跡可能

## 🏗️ プロジェクト構造

```
stock-scanner/
├── stock-scanner-backend/          # Python FastAPI バックエンド
│   ├── app/
│   │   ├── main.py                # FastAPI アプリケーションエントリポイント
│   │   ├── models.py              # Pydantic API スキーマ
│   │   ├── routers/
│   │   │   └── predict.py         # 予測エンドポイント
│   │   └── services/
│   │       ├── data_fetcher.py    # データ取得サービス
│   │       ├── prediction.py      # 予測アルゴリズム
│   │       └── backtest.py        # バックテストエンジン
│   ├── config.py                  # 設定管理
│   ├── requirements.txt           # Python 依存関係
│   ├── Dockerfile                 # Docker イメージ
│   └── .env.example              # 環境変数テンプレート
│
├── stock-scanner-frontend/        # Next.js フロントエンド
│   ├── pages/
│   │   ├── index.tsx             # メインページ
│   │   └── _app.tsx              # アプリケーションラッパー
│   ├── components/
│   │   ├── PeriodSelector.tsx    # 期間選択タブ
│   │   ├── MarketToggle.tsx      # 市場切り替え
│   │   ├── CoefficientSliders.tsx # 係数調整UI
│   │   └── StockList.tsx         # 結果表示テーブル
│   ├── store/
│   │   └── prediction.ts         # Zustand 状態管理
│   ├── lib/
│   │   ├── api.ts               # API クライアント
│   │   └── config.ts            # フロント設定
│   ├── styles/
│   │   └── globals.css          # グローバルスタイル
│   ├── public/
│   │   ├── manifest.json        # PWA マニフェスト
│   │   └── service-worker.js    # Service Worker
│   ├── package.json             # npm 依存関係
│   ├── tsconfig.json            # TypeScript 設定
│   ├── next.config.js           # Next.js 設定
│   ├── Dockerfile.dev           # Docker イメージ
│   └── .env.example            # 環境変数テンプレート
│
├── docker-compose.yml            # Docker Compose オーケストレーション
├── .env.example                 # グローバル環境変数テンプレート
└── README.md                    # このファイル
```

## 🚀 クイックスタート

### 前提条件
- Docker & Docker Compose
- または Node.js 18+, Python 3.10+

### Docker で起動（推奨）

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/stock-scanner.git
cd stock-scanner

# 環境変数の設定
cp .env.example .env

# Docker Compose で起動
docker-compose up -d

# ブラウザで http://localhost:3000 にアクセス
```

### ローカル開発

#### バックエンド
```bash
cd stock-scanner-backend

# Python 環境の構築
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# FastAPI サーバー起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### フロントエンド
```bash
cd stock-scanner-frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
```

## 📊 API エンドポイント

### 1. 予測 API
```http
POST /api/predict
Content-Type: application/json

{
  "symbols": ["7203.T", "9984.T"],
  "period": "1w",
  "market": "JPX",
  "coefficients": {
    "period": "1w",
    "w_ret": 0.5,
    "w_sma": 0.3,
    "w_vol": 0.2,
    "w_per": 0.2,
    "w_pbr": 0.15,
    "w_roe": 0.3,
    "w_growth": 0.35
  }
}
```

### 2. バックテスト API
```http
POST /api/backtest
Content-Type: application/json

{
  "symbols": ["7203.T", "9984.T"],
  "period": "1w",
  "market": "JPX",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "probability_threshold": 0.65
}
```

### 3. 銘柄リスト API
```http
GET /api/stocks/JPX
GET /api/stocks/NYSE
```

### 4. ヘルスチェック
```http
GET /api/health
```

## 🔧 設定

### バックエンド設定 (`config.py`)

**期間設定:**
- `PERIOD_1W`: 1 週間 (SMA 5/20, 目標 +10%)
- `PERIOD_1M`: 1 ヶ月 (SMA 15/40, 目標 +15%)
- `PERIOD_6M`: 6 ヶ月 (SMA 50/200, 目標 +30%)

**デフォルト係数:**
```python
DEFAULT_COEFFICIENTS = {
    '1w': {
        'w_ret': 0.5,      # 直近リターン
        'w_sma': 0.3,      # SMA クロス
        'w_vol': 0.2,      # 出来高
        'w_per': 0.20,     # PER
        'w_pbr': 0.15,     # PBR
        'w_roe': 0.30,     # ROE
        'w_growth': 0.35   # 成長率
    }
    # ... 1m, 6m の設定も同様
}
```

### フロント設定 (`lib/config.ts`)

市場と期間の設定が定義されています。

## 📈 アルゴリズム概要

### モメンタムスコア
```
momentum = w_ret * return_score 
         + w_sma * sma_score 
         + w_vol * volume_score
```

### バリュエーションスコア
```
value = w_per * per_score 
      + w_pbr * pbr_score 
      + w_roe * roe_score 
      + w_growth * growth_score
```

### 複合スコア
```
composite = w_momentum * momentum 
          + w_value * value
          + adjustments (期間別)
```

### 確率予測
```
probability = sigmoid(composite_score * period_scale) * 100
```

## 🧪 バックテスト

過去データでモデルのパフォーマンスを検証：

```bash
POST /api/backtest
{
  "symbols": ["7203.T"],
  "period": "1w",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01"
}
```

**計測メトリクス:**
- Hit Rate: シグナルが成功した割合
- Average Return: 平均リターン
- Win Rate: 勝率
- Sharpe Ratio: リスク調整後リターン
- Max Drawdown: 最大落ち込み

## 🌐 デプロイ

### Render へバックエンド展開
```bash
# Render CLI でデプロイ
render deploy
```

### Vercel へフロントエンド展開
```bash
# Vercel CLI でデプロイ
vercel
```

## 🔒 セキュリティ

- CORS は環境変数で制御
- API キーは環境変数に格納
- yfinance は読み取り専用
- バリデーションは Pydantic で実装

## 📱 PWA 機能

- ✅ ホーム画面インストール対応
- ✅ オフラインモード（キャッシュ優先）
- ✅ iOS サポート
- ✅ プッシュ通知対応
- ✅ バックグラウンド同期

## 📚 技術スタック

### フロントエンド
- **Next.js 14**: React フレームワーク
- **TypeScript**: 型安全性
- **Zustand**: 状態管理
- **Tailwind CSS**: スタイリング
- **RC Slider**: コンポーネント UI
- **next-pwa**: PWA サポート

### バックエンド
- **Python 3.10+**: プログラミング言語
- **FastAPI**: 非同期 Web フレームワーク
- **Pydantic**: データ検証
- **yfinance**: 株価データ取得
- **pandas/numpy**: 数値計算
- **scikit-learn**: 機械学習計算

### インフラ
- **Docker**: コンテナ化
- **Docker Compose**: オーケストレーション
- **Render**: バックエンド ホスティング
- **Vercel**: フロントエンド ホスティング

## 🤝 貢献

プルリクエスト歓迎！大きな変更の場合は、まずイシューを開いてください。

## 📝 ライセンス

MIT

## ⚠️ 免責事項

このアプリケーションは教育目的です。実際の投資判断にはご使用ください。著者は投資による損失に責任を負いません。

## 📧 サポート

質問や問題がある場合は、GitHub Issues で報告してください。

---

**Made with ❤️ by Stock Scanner Team**
