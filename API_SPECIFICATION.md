# API仕様書

## 概要

RESTful API設計に基づくバックエンドAPI仕様書

---

## 1. ベースURL

```
本番: https://api.stock-predictor.app
ステージング: https://api-staging.stock-predictor.app
開発: http://localhost:3001
```

---

## 2. 認証

現在は不要（オプション: API キー方式を推奨）

---

## 3. エンドポイント一覧

### 3.1 予測データ取得

#### GET /api/predictions

**説明**: 指定期間の予測トップ10銘柄を取得

**クエリパラメータ**:
```
- period: string (必須)
  * 週間単位:
    - 'past-3w-2w': 3週間前→2週間前（実績）
    - 'past-2w-1w': 2週間前→1週間前（実績）
    - 'past-1w-now': 1週間前→現在（実績）
    - 'now-1w-future': 現在→1週間後（予測）
  * 月間単位:
    - 'past-3m-2m': 3ヶ月前→2ヶ月前（実績）
    - 'past-2m-1m': 2ヶ月前→1ヶ月前（実績）
    - 'past-1m-now': 1ヶ月前→現在（実績）
    - 'now-1m-future': 現在→1ヶ月後（予測）
  * 半年単位:
    - 'past-1y-6m': 1年前→6ヶ月前（実績）
    - 'past-6m-now': 6ヶ月前→現在（実績）
    - 'now-6m-future': 現在→6ヶ月後（予測）
- market: 'JPX' | 'NYSE' | 'all' (デフォルト: 'all')
- useCoefficients: JSON (オプション、カスタム係数)
```

**リクエスト例**:
```
# 週間単位（デフォルト）
GET /api/predictions?period=now-1w-future&market=JPX

# 月間単位
GET /api/predictions?period=now-1m-future&market=all

# 半年単位
GET /api/predictions?period=now-6m-future&market=JPX
```

**レスポンス成功 (200)**:
```json
{
  "success": true,
  "data": {
    "period": "now-1w-future",
    "predictions": [
      {
        "rank": 1,
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "market": "NYSE",
        "predictedReturn": 12.5,
        "predictedProbability": 78.3,
        "current_price": 185.50,
        "target_price": 208.69
      },
      {
        "rank": 2,
        "symbol": "7203",
        "name": "トヨタ自動車",
        "market": "JPX",
        "predictedReturn": 11.2,
        "predictedProbability": 72.1,
        "current_price": 2450,
        "target_price": 2724.40
      }
      // ... (最大10件)
    ]
  },
  "meta": {
    "generatedAt": "2026-04-20T15:30:00Z",
    "cachedAt": "2026-04-20T15:00:00Z"
  }
}
```

**レスポンスエラー (400)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PERIOD",
    "message": "Invalid period parameter"
  }
}
```

---

#### GET /api/predictions/detailed/:symbol

**説明**: 個別銘柄の詳細予測情報を取得

**パラメータ**:
```
- symbol: string (銘柄シンボル, 例: 'AAPL')
```

**レスポンス (200)**:
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "market": "NYSE",
    "current_price": 185.50,
    "prediction": {
      "period": "now-1w-future",
      "predicted_return": 12.5,
      "probability_of_10pct_rise": 78.3,
      "target_price": 208.69
    },
    "technical_indicators": {
      "sma_5": 184.20,
      "sma_25": 182.10,
      "momentum": 3.4,
      "volume_avg_20": 42500000
    },
    "fundamental_data": {
      "per": 28.5,
      "pbr": 45.2,
      "roe": 95.2,
      "revenue_growth_rate": 5.2
    },
    "historical": {
      "past_3w_2w": {
        "actual_return": 8.5,
        "predicted_return": 9.2
      },
      "past_2w_1w": {
        "actual_return": -2.1,
        "predicted_return": 1.5
      },
      "past_1w_now": {
        "actual_return": 6.3,
        "predicted_return": 5.8
      }
    }
  }
}
```

---

#### POST /api/predictions/test-coefficients

**説明**: カスタム係数での予測をテスト (検証用)

**リクエストボディ**:
```json
{
  "period": "now-1w-future",
  "coefficients": {
    "technical_weight": 0.7,
    "fundamental_weight": 0.3,
    "technical": {
      "sma_cross_weight": 0.5,
      "momentum_weight": 0.3,
      "volume_weight": 0.2
    },
    "fundamental": {
      "per_weight": 0.2,
      "pbr_weight": 0.1,
      "roe_weight": 0.4,
      "revenue_growth_weight": 0.3
    },
    "sigmoid_scale": 18.0
  }
}
```

**レスポンス (200)**:
```json
{
  "success": true,
  "data": {
    "coefficients_hash": "abc123def456",
    "predictions": [
      {
        "rank": 1,
        "symbol": "AAPL",
        "predictedReturn": 14.2,
        "predictedProbability": 81.5
      }
      // ... (最大10件)
    ]
  }
}
```

---

### 3.2 株価データ取得

#### GET /api/stocks

**説明**: 銘柄一覧を取得

**クエリパラメータ**:
```
- market: 'JPX' | 'NYSE' | 'all' (デフォルト: 'all')
- search: string (検索キーワード)
- limit: number (デフォルト: 100)
```

**レスポンス (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "market": "NYSE",
      "sector": "Technology",
      "country": "US"
    },
    {
      "id": 2,
      "symbol": "7203",
      "name": "トヨタ自動車",
      "market": "JPX",
      "sector": "Automotive",
      "country": "JP"
    }
  ]
}
```

---

#### GET /api/stocks/:symbol/prices

**説明**: 銘柄の日次株価データを取得

**クエリパラメータ**:
```
- from: ISO date (例: 2026-04-01)
- to: ISO date (例: 2026-04-20)
- limit: number (デフォルト: 60)
```

**レスポンス (200)**:
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "prices": [
      {
        "date": "2026-04-20",
        "open": 183.50,
        "high": 187.20,
        "low": 183.10,
        "close": 185.50,
        "volume": 42500000
      },
      {
        "date": "2026-04-19",
        "open": 182.30,
        "high": 184.60,
        "low": 181.80,
        "close": 183.40,
        "volume": 39200000
      }
    ]
  }
}
```

---

#### GET /api/stocks/:symbol/financial

**説明**: 銘柄の財務データを取得

**レスポンス (200)**:
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "financial": [
      {
        "period_date": "2026-03-31",
        "period_type": "Q2",
        "per": 28.5,
        "pbr": 45.2,
        "roe": 95.2,
        "revenue": 94736000000,
        "net_income": 21748000000
      },
      {
        "period_date": "2025-12-31",
        "period_type": "Q1",
        "per": 27.8,
        "pbr": 43.5,
        "roe": 92.1,
        "revenue": 119576000000,
        "net_income": 29736000000
      }
    ]
  }
}
```

---

### 3.3 テクニカル指標

#### GET /api/technical/:symbol

**説明**: テクニカル指標データを取得

**クエリパラメータ**:
```
- from: ISO date (例: 2026-03-20)
- to: ISO date (例: 2026-04-20)
```

**レスポンス (200)**:
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "indicators": [
      {
        "date": "2026-04-20",
        "sma_5": 184.20,
        "sma_25": 182.10,
        "momentum": 3.4,
        "volume_avg_20": 42500000
      },
      {
        "date": "2026-04-19",
        "sma_5": 183.60,
        "sma_25": 181.80,
        "momentum": 2.8,
        "volume_avg_20": 42100000
      }
    ]
  }
}
```

---

### 3.4 ユーザー設定

#### GET /api/settings/coefficients

**説明**: ユーザーのカスタム係数を取得

**レスポンス (200)**:
```json
{
  "success": true,
  "data": {
    "user_id": "device-id-12345",
    "coefficients": {
      "technical_weight": 0.6,
      "fundamental_weight": 0.4,
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
  }
}
```

---

#### POST /api/settings/coefficients

**説明**: ユーザーのカスタム係数を保存

**リクエストボディ**:
```json
{
  "coefficients": {
    "technical_weight": 0.7,
    "fundamental_weight": 0.3,
    "technical": {
      "sma_cross_weight": 0.5,
      "momentum_weight": 0.3,
      "volume_weight": 0.2
    },
    "fundamental": {
      "per_weight": 0.2,
      "pbr_weight": 0.1,
      "roe_weight": 0.4,
      "revenue_growth_weight": 0.3
    },
    "sigmoid_scale": 18.0
  }
}
```

**レスポンス (200)**:
```json
{
  "success": true,
  "message": "Coefficients saved successfully"
}
```

---

### 3.5 ヘルスチェック

#### GET /health

**説明**: API ヘルスチェック

**レスポンス (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-20T15:30:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "external_apis": "ok"
  }
}
```

---

## 4. エラーコード

| コード | HTTP | 説明 |
|-------|------|------|
| OK | 200 | 成功 |
| INVALID_PERIOD | 400 | 無効な期間指定 |
| SYMBOL_NOT_FOUND | 404 | 銘柄が見つからない |
| INVALID_COEFFICIENTS | 400 | 無効な係数 |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバーエラー |

---

## 5. レート制限

```
- デフォルト: 100 req/min
- 認証済み: 1000 req/min
- バッチ API: カスタム制限

レート超過時: Retry-After ヘッダで再試行時間を指示
```

---

## 6. キャッシング戦略

| リソース | TTL | 説明 |
|---------|-----|------|
| /predictions | 1h | 予測結果（計算コスト高） |
| /stocks/prices | 1h | 株価データ（日次更新） |
| /technical | 1h | テクニカル指標 |
| /financial | 7d | 財務データ（更新頻度低） |
| /stocks (list) | 24h | 銘柄マスタ |

---

