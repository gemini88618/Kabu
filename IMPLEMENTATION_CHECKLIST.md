# 実装ガイド＆チェックリスト

## 1. 初期セットアップ

### 1.1 リポジトリ構成

```bash
# リポジトリ作成
git init stock-prediction-pwa
cd stock-prediction-pwa

# サブディレクトリ作成
mkdir frontend backend data-processor shared docs .github

# 各レイヤーの初期化
cd frontend && npm init -y && npm install next react typescript tailwindcss
cd ../backend && npm init -y && npm install express prisma typescript
cd ../data-processor && python -m venv venv && pip install -r requirements.txt
```

### 1.2 必須ツール

```bash
# Node.js & npm
node --version  # v20以上推奨
npm --version   # v10以上

# Python
python --version  # 3.10以上推奨

# PostgreSQL (ローカル開発用)
psql --version

# Docker (本番デプロイ用)
docker --version
```

---

## 2. フロントエンド実装チェックリスト

### 2.1 プロジェクト初期化

- [ ] `frontend/` に Next.js 14 プロジェクト作成
  ```bash
  cd frontend
  npx create-next-app@latest . --typescript --tailwind
  ```

- [ ] PWA設定 (next-pwa)
  ```bash
  npm install next-pwa
  # next.config.js に設定追加
  ```

- [ ] TypeScript設定確認
  ```bash
  cat tsconfig.json
  ```

### 2.2 ディレクトリ構造

- [ ] `src/app/` - ページルーティング
- [ ] `src/components/` - UI コンポーネント
- [ ] `src/stores/` - Zustand ストア
- [ ] `src/hooks/` - カスタムフック
- [ ] `src/services/` - API通信ロジック
- [ ] `src/utils/` - ユーティリティ関数
- [ ] `public/manifest.json` - PWAマニフェスト

### 2.3 主要コンポーネント実装

#### Pages
- [ ] `page.tsx` (ホーム - 期間選択 + トップ10表示)
- [ ] `predictions/[period]/page.tsx` (期間別詳細)
- [ ] `settings/page.tsx` (係数調整)

#### Components
- [ ] `PeriodSelector.tsx` (複数期間の切り替え - 週間/月間/半年間)
  - [ ] 期間タイプ切り替えボタン (Weekly / Monthly / Half-yearly)
  - [ ] 各期間タイプ内での期間選択
  - [ ] 実績/予測の自動判定表示
- [ ] `StockCard.tsx` (銘柄カード - 銘柄名、上昇率、確率表示)
- [ ] `StockChart.tsx` (チャート - Recharts使用)
- [ ] `CoefficientForm.tsx` (係数調整フォーム)
- [ ] `StockList.tsx` (トップ10リスト)
- [ ] `Loading.tsx` (ローディング画面)
- [ ] `Error.tsx` (エラー表示)

#### Stores (Zustand)
- [ ] `predictionStore.ts` (予測データ管理)
- [ ] `settingsStore.ts` (ユーザー係数管理)
- [ ] `uiStore.ts` (UI状態: 選択期間, ローディング等)

#### Services
- [ ] `api.ts` (バックエンド通信)
- [ ] `storage.ts` (IndexedDB/LocalStorage)

#### Hooks
- [ ] `usePredictions()` (予測データ取得)
- [ ] `useSettings()` (設定取得・更新)
- [ ] `useOffline()` (オフライン判定)

### 2.4 PWA対応

- [ ] `public/manifest.json` 作成
  ```json
  {
    "name": "Stock Price Predictor",
    "short_name": "Stock Predictor",
    "icons": [
      {
        "src": "/icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#000000"
  }
  ```

- [ ] `public/offline.html` 作成
- [ ] Service Worker登録 (next-pwaで自動)
- [ ] `_app.tsx` でPWA初期化

### 2.5 スタイリング

- [ ] Tailwind CSS 設定
- [ ] グローバルスタイル (`styles/globals.css`)
- [ ] レスポンシブデザイン確認 (モバイル最適化)

### 2.6 UI/UXチェック

- [ ] iPhone Safari でホーム画面追加テスト
- [ ] オフライン時のフォールバック表示
- [ ] ローディング状態表示
- [ ] エラーハンドリング画面
- [ ] 期間切り替えスムーズ
- [ ] 係数スライダー機能

### 2.7 パフォーマンス

- [ ] バンドルサイズ最適化
  ```bash
  npm run build
  npm run analyze  # next-bundle-analyzer
  ```
- [ ] Lighthouse スコア確認 (目標: 90以上)
- [ ] キャッシング戦略実装

---

## 3. バックエンド実装チェックリスト

### 3.1 プロジェクト初期化

- [ ] `backend/` に Node.js + Express プロジェクト作成
  ```bash
  cd backend
  npm init -y
  npm install express prisma typescript ts-node
  npm install --save-dev @types/node nodemon
  ```

- [ ] Prisma 初期化
  ```bash
  npx prisma init
  ```

### 3.2 データベース設定

- [ ] PostgreSQL ローカル立ち上げ
- [ ] `.env` に接続文字列設定
  ```
  DATABASE_URL="postgresql://user:password@localhost:5432/stock_predictor"
  ```

- [ ] Prisma スキーマ設定 (`prisma/schema.prisma`)
  - [ ] stocks テーブル
  - [ ] daily_prices テーブル
  - [ ] financial_data テーブル
  - [ ] technical_indicators テーブル
  - [ ] prediction_results テーブル
  - [ ] user_settings テーブル
  - [ ] algorithm_versions テーブル

- [ ] マイグレーション実行
  ```bash
  npx prisma migrate dev --name init
  ```

- [ ] Prisma Client 生成
  ```bash
  npx prisma generate
  ```

### 3.3 API エンドポイント実装

#### /api/predictions
- [ ] GET `/api/predictions?period=...&market=...` 実装
- [ ] キャッシング (Redis/メモリ)
- [ ] エラーハンドリング

#### /api/stocks
- [ ] GET `/api/stocks` (銘柄一覧)
- [ ] GET `/api/stocks/:symbol/prices` (株価)
- [ ] GET `/api/stocks/:symbol/financial` (財務)

#### /api/technical
- [ ] GET `/api/technical/:symbol` (テクニカル指標)

#### /api/settings
- [ ] GET `/api/settings/coefficients` (ユーザー係数取得)
- [ ] POST `/api/settings/coefficients` (係数保存)

#### その他
- [ ] POST `/api/predictions/test-coefficients` (係数テスト)
- [ ] GET `/health` (ヘルスチェック)

### 3.4 ビジネスロジック

#### Services
- [ ] `stockService.ts` (銘柄管理)
- [ ] `priceService.ts` (株価管理)
- [ ] `financialService.ts` (財務管理)
- [ ] `technicalService.ts` (テクニカル指標)
- [ ] `predictionService.ts` (予測計算)

#### Controllers
- [ ] `stockController.ts`
- [ ] `predictionController.ts`
- [ ] `technicalController.ts`
- [ ] `settingsController.ts`

#### Repositories
- [ ] `stockRepository.ts`
- [ ] `priceRepository.ts`
- [ ] `financialRepository.ts`
- [ ] `predictionRepository.ts`

### 3.5 ミドルウェア

- [ ] エラーハンドラ
- [ ] CORS設定
- [ ] レート制限 (express-rate-limit)
- [ ] ログミドルウェア (winston)

### 3.6 テスト

- [ ] 単体テスト (Jest)
  ```bash
  npm install --save-dev jest @types/jest ts-jest
  ```
- [ ] 統合テスト
- [ ] API エンドポイント テスト

### 3.7 デプロイ準備

- [ ] Dockerfile 作成
- [ ] docker-compose.yml 設定
- [ ] 環境変数テンプレート (`.env.example`)

---

## 4. データ処理 (Python) 実装チェックリスト

### 4.1 プロジェクト初期化

- [ ] Python 仮想環境作成
  ```bash
  cd data-processor
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```

- [ ] 依存関係インストール
  ```bash
  pip install pandas numpy scipy scikit-learn yfinance requests psycopg2 apscheduler
  pip freeze > requirements.txt
  ```

### 4.2 データ取得モジュール

#### `data_fetchers/`
- [ ] `base_fetcher.py` (基底クラス)
- [ ] `japan_stock_fetcher.py` (日本株 - iFinance)
- [ ] `us_stock_fetcher.py` (米国株 - FINNHUB)
- [ ] `financial_fetcher.py` (財務データ)

実装内容:
```python
class JapanStockFetcher(BaseFetcher):
    def fetch_daily_prices(self, symbol, from_date, to_date):
        # iFinance APIで取得
        pass
    
    def fetch_financial_data(self, symbol):
        # 企業情報取得
        pass
```

### 4.3 指標計算モジュール

#### `indicators/`
- [ ] `technical_indicators.py`
  - [ ] SMA (5日, 25日)
  - [ ] ROC (モメンタム)
  - [ ] 出来高分析

- [ ] `moving_average.py` (移動平均線)
- [ ] `momentum.py` (モメンタム計算)
- [ ] `volume_analysis.py` (出来高分析)

### 4.4 アルゴリズム実装

#### `algorithms/`
- [ ] `base_algorithm.py` (基底クラス)
- [ ] `v1_algorithm.py` (v1 実装)
  ```python
  class V1Algorithm(BaseAlgorithm):
      def predict(self, symbol, technical_data, fundamental_data):
          # 指標計算
          # スコア計算
          # 確率変換
          return probability, predicted_return
  ```

- [ ] `coefficients.py` (係数管理)
  ```python
  DEFAULT_COEFFICIENTS = {
      "technical_weight": 0.6,
      "fundamental_weight": 0.4,
      # ...
  }
  ```

### 4.5 バッチ処理

#### `batch_jobs/`
- [ ] `daily_update.py` (日次データ取得)
  - [ ] 15:15 JST (日本株)
  - [ ] 21:00 JST (米国株)

- [ ] `compute_indicators.py` (指標計算)
- [ ] `run_predictions.py` (予測実行)
- [ ] `scheduler.py` (APScheduler統合)

```python
# scheduler.py 例
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_daily_update, 'cron', hour=15, minute=15)
    scheduler.add_job(run_predictions, 'cron', hour=15, minute=30)
    scheduler.start()
```

### 4.6 データベース接続

#### `database/`
- [ ] `connection.py` (PostgreSQL接続)
- [ ] `models.py` (SQLAlchemy モデル)
- [ ] `queries.py` (SQL実行)

### 4.7 テスト

- [ ] 単体テスト (pytest)
  ```bash
  pip install pytest pytest-cov
  pytest tests/
  ```

### 4.8 ログ設定

- [ ] `logger.py` (ログ設定)

---

## 5. 共有コード実装チェックリスト

### 5.1 型定義 (`shared/types/`)

- [ ] `stock.ts` - 銘柄型
  ```typescript
  interface Stock {
    id: number;
    symbol: string;
    name: string;
    market: 'JPX' | 'NYSE';
    // ...
  }
  ```

- [ ] `prediction.ts` - 予測型
  ```typescript
  interface Prediction {
    symbol: string;
    predictedReturn: number;
    probability: number;
    // ...
  }
  ```

- [ ] `api.ts` - API レスポンス型

### 5.2 定数 (`shared/constants/`)

- [ ] `markets.ts`
  ```typescript
  export const MARKETS = {
    JPX: 'JPX',
    NYSE: 'NYSE',
  };
  ```

- [ ] `periods.ts` - 期間定義
  ```typescript
  export const PERIOD_TYPES = ['weekly', 'monthly', 'half-yearly'] as const;
  
  export const PERIODS = {
    weekly: [
      { id: 'past-3w-2w', label: '3週間前→2週間前', type: 'actual' },
      { id: 'past-2w-1w', label: '2週間前→1週間前', type: 'actual' },
      { id: 'past-1w-now', label: '1週間前→現在', type: 'actual' },
      { id: 'now-1w-future', label: '現在→1週間後', type: 'predicted' },
    ],
    monthly: [
      { id: 'past-3m-2m', label: '3ヶ月前→2ヶ月前', type: 'actual' },
      { id: 'past-2m-1m', label: '2ヶ月前→1ヶ月前', type: 'actual' },
      { id: 'past-1m-now', label: '1ヶ月前→現在', type: 'actual' },
      { id: 'now-1m-future', label: '現在→1ヶ月後', type: 'predicted' },
    ],
    'half-yearly': [
      { id: 'past-1y-6m', label: '1年前→6ヶ月前', type: 'actual' },
      { id: 'past-6m-now', label: '6ヶ月前→現在', type: 'actual' },
      { id: 'now-6m-future', label: '現在→6ヶ月後', type: 'predicted' },
    ],
  };
  ```

- [ ] `algorithms.ts`
  ```typescript
  export const ALGORITHM_VERSIONS = ['v1', 'v2'];
  
  // 期間別アルゴリズム係数プリセット
  export const ALGORITHM_PRESETS = {
    weekly: {
      technical_weight: 0.7,
      fundamental_weight: 0.3,
    },
    monthly: {
      technical_weight: 0.6,
      fundamental_weight: 0.4,
    },
    'half-yearly': {
      technical_weight: 0.4,
      fundamental_weight: 0.6,
    },
  };
  ```

---

## 6. CI/CD パイプライン設定

### 6.1 GitHub Actions

- [ ] `.github/workflows/test-frontend.yml`
  ```yaml
  - npm ci
  - npm run lint
  - npm run test
  - npm run build
  ```

- [ ] `.github/workflows/test-backend.yml`
  ```yaml
  - npm ci
  - npm run lint
  - npm run test
  - npm run build
  ```

- [ ] `.github/workflows/test-data-processor.yml`
  ```yaml
  - pip install -r requirements.txt
  - pytest tests/
  ```

- [ ] `.github/workflows/deploy-frontend.yml`
  - [ ] Vercel デプロイ自動化

- [ ] `.github/workflows/deploy-backend.yml`
  - [ ] Railway/Heroku デプロイ自動化

---

## 7. ローカル開発環境セットアップ

### 7.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: stock_predictor
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

### 7.2 起動

```bash
# 全コンポーネント起動
docker-compose up

# 確認
# フロント: http://localhost:3000
# バック: http://localhost:3001
# DB: localhost:5432
# Redis: localhost:6379
```

---

## 8. 本番デプロイ

### 8.1 フロントエンド (Vercel)

- [ ] GitHub連携
- [ ] 環境変数設定
  - `NEXT_PUBLIC_API_URL=https://api.stock-predictor.app`
- [ ] デプロイ
  ```bash
  vercel deploy --prod
  ```

### 8.2 バックエンド (Railway)

- [ ] GitHub連携
- [ ] 環境変数設定
  - `DATABASE_URL=...`
  - `REDIS_URL=...`
  - `API_KEYS=...`
- [ ] デプロイ
  ```bash
  railway deploy
  ```

### 8.3 データベース (Vercel Postgres / AWS RDS)

- [ ] マイグレーション実行
  ```bash
  npm run prisma migrate deploy
  ```

- [ ] バックアップ設定
- [ ] レプリケーション設定 (本番要件)

### 8.4 キャッシング (Vercel KV)

- [ ] Redis設定
- [ ] TTL設定

### 8.5 ドメイン・SSL

- [ ] カスタムドメイン設定
- [ ] SSL証明書 (Let's Encrypt)

---

## 9. 監視・ロギング

### 9.1 バックエンド監視

- [ ] Sentry (エラートラッキング)
- [ ] DataDog (パフォーマンス監視)
- [ ] ヘルスチェック エンドポイント

### 9.2 フロントエンド監視

- [ ] Sentry (クライアントエラー)
- [ ] Google Analytics (ユーザー分析)

### 9.3 データベース監視

- [ ] クエリログ
- [ ] スロークエリ検出
- [ ] ディスク容量監視

---

## 10. セキュリティチェック

- [ ] API キー管理 (環境変数化)
- [ ] CORS設定確認
- [ ] HTTPS有効化
- [ ] CSP (Content Security Policy) 設定
- [ ] CSRF トークン実装
- [ ] SQL インジェクション対策 (Prismaで自動)
- [ ] XSS対策
- [ ] レート制限実装
- [ ] セキュリティヘッダー設定

---

## 11. ドキュメント作成

- [ ] README.md
- [ ] ARCHITECTURE.md (アーキテクチャ詳細)
- [ ] INSTALLATION.md (インストール手順)
- [ ] DEVELOPMENT.md (開発ガイド)
- [ ] API.md (API仕様)
- [ ] DEPLOYMENT.md (デプロイメント手順)
- [ ] ALGORITHM.md (アルゴリズム詳細)

---

## 12. リリース準備

### 12.1 ベータテスト

- [ ] iPhone Safari でのテスト
- [ ] ホーム画面追加テスト
- [ ] オフライン機能テスト
- [ ] パフォーマンステスト

### 12.2 バージョンタグ

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

### 12.3 リリースノート

- [ ] v1.0.0 変更内容をまとめる

---

## 13. 進捗追跡

### 進捗率計算
```
フロントエンド: __% 完了
バックエンド: __% 完了
データ処理: __% 完了
全体: __% 完了
```

### 期間目安
- Phase 1 (MVP): 4週間
- Phase 2 (拡張): 3週間
- Phase 3 (本番化): 2週間

---

## 14. よくある問題と解決策

### Q1: ORM (Prisma vs SQLAlchemy) の選択
**A**: 
- Node.js: Prisma (型安全性高い)
- Python: SQLAlchemy (Pandas連携しやすい)

### Q2: API キー管理
**A**: 環境変数 → Vercel Secrets / GitHub Secrets で管理

### Q3: テクニカル指標計算の最適化
**A**: NumPy/Pandas で並列化、キャッシング活用

### Q4: 本番データベースのスケーリング
**A**:読み込みレプリカ追加、インデックス最適化、クエリキャッシング

---

## チェックリスト完了時点での確認事項

- [ ] 全テスト合格 (100%カバレッジ目標)
- [ ] Lighthouse スコア 90以上
- [ ] ビルドサイズ最適化完了
- [ ] セキュリティ監査完了
- [ ] ドキュメント完成
- [ ] 本番環境構成確認
- [ ] バックアップ・復旧テスト完了
- [ ] ユーザー受け入れテスト (UAT) 完了

