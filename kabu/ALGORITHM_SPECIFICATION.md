# 予測アルゴリズム詳細仕様書

## 1. アルゴリズムの概要

### 1.1 目的

「1週間以内に+10%以上上昇する確率」を算出するための複合アルゴリズム

### 1.2 実装方針

- **マルチファクターモデル**: テクニカルとファンダメンタルズを統合
- **確率ベース**: 単純な上昇予測ではなく「確率」を出力
- **係数カスタマイズ可能**: ユーザーが重み付けを変更可能
- **バージョン管理**: アルゴリズム改善時に複数バージョンを管理

---

## 2. 計算フロー

```
入力: symbol, period, coefficients
  ↓
1. テクニカルデータ取得
   - 過去60日間の株価
   - 移動平均線 (SMA 5, 25)
   - モメンタム (ROC)
   - 出来高データ
  ↓
2. ファンダメンタルズデータ取得
   - PER (株価収益率)
   - PBR (株価純資産倍率)
   - ROE (自己資本利益率)
   - 売上成長率 (YoY)
  ↓
3. スコア計算
   - テクニカルスコア計算
   - ファンダメンタルズスコア計算
   - 統合スコア計算
  ↓
4. 確率変換
   - シグモイド関数で正規化
   - 0-100% の確率に変換
  ↓
出力: 確率 (%), 上昇予測率 (%)
```

---

## 3. テクニカル分析

### 3.1 移動平均線 (SMA)

```python
SMA_5(t) = (Close[t] + Close[t-1] + ... + Close[t-4]) / 5
SMA_25(t) = (Close[t] + Close[t-1] + ... + Close[t-24]) / 25

テクニカルスコア_SMA_クロス = {
  +1.0 if SMA_5[t] > SMA_25[t]   # ゴールデンクロス (強気)
  -1.0 if SMA_5[t] < SMA_25[t]   # デッドクロス (弱気)
  0.0 otherwise
}
```

**解釈**:
- SMA_5がSMA_25上方: トレンド転換の可能性 (上昇シグナル)
- SMA_5がSMA_25下方: ダウントレンド確認 (下降シグナル)

---

### 3.2 モメンタム (Rate of Change)

```python
ROC_14(t) = ((Close[t] - Close[t-14]) / Close[t-14]) * 100

テクニカルスコア_モメンタム = {
  +1.0 if ROC_14[t] > 5%     # 強い上昇モメンタム
  +0.5 if ROC_14[t] > 0%     # 弱い上昇モメンタム
  -0.5 if ROC_14[t] < 0%     # 弱い下降モメンタム
  -1.0 if ROC_14[t] < -5%    # 強い下降モメンタム
}
```

**解釈**:
- 正のモメンタム: 価格が上昇トレンド
- 負のモメンタム: 価格が下降トレンド

---

### 3.3 出来高分析 (Volume)

```python
Avg_Volume_20 = sum(Volume[t-19:t]) / 20

Volume_Score = {
  +0.5 if Volume[t] > Avg_Volume_20 * 1.2
  -0.3 if Volume[t] < Avg_Volume_20 * 0.8
  0.0 otherwise
}

テクニカルスコア_出来高 = {
  +1.0 if Volume[t] > Avg_Volume_20 * 1.5  # 高出来高 + 上昇 = 強気確認
  +0.3 if Volume[t] > Avg_Volume_20 * 1.2
  -0.5 if Volume[t] < Avg_Volume_20 * 0.5  # 低出来高 = 弱気
}
```

**解釈**:
- 高出来高の上昇: 売上高トレンド確認
- 低出来高の上昇: 反発の可能性が低い

---

### 3.4 テクニカルスコア統合

```python
テクニカルスコア = 
  w_sma × score_sma_cross +
  w_momentum × score_momentum +
  w_volume × score_volume

# デフォルト係数
w_sma = 0.4
w_momentum = 0.3
w_volume = 0.3
```

**範囲**: -1.0 ～ +1.0

---

## 4. ファンダメンタルズ分析

### 4.1 PER (株価収益率) 評価

```python
PER スコア = {
  +1.0 if PER < 12        # 極度に低い（割安）
  +0.8 if PER < 15        # 低い
  +0.5 if PER < 20        # 中程度（公定値付近）
  0.0  if 20 <= PER <= 25  # 適正
  -0.3 if 25 < PER <= 35   # やや高い
  -0.7 if PER > 35         # 高い（割高）
}

正規化: PER_Score = max(-1.0, min(1.0, PER_Score))
```

**解釈**:
- PER が低い = 利益に対して株価が割安 = 上昇ポテンシャル高い
- PER が高い = 割高 = 調整圧力

---

### 4.2 PBR (株価純資産倍率) 評価

```python
PBR スコア = {
  +1.0 if PBR < 0.8       # 極度に低い
  +0.7 if PBR < 1.0       # 低い（資産価値以下）
  +0.3 if PBR < 1.5       # 中程度
  0.0  if 1.5 <= PBR <= 2.0  # 適正
  -0.3 if 2.0 < PBR <= 3.0  # やや高い
  -0.7 if PBR > 3.0       # 高い
}
```

**解釈**:
- PBR < 1.0 = 資産価値以下 = 割安の可能性
- PBR > 3.0 = 資産比で割高 = リスク

---

### 4.3 ROE (自己資本利益率) 評価

```python
ROE スコア = {
  +1.0 if ROE > 20%       # 非常に高い（優秀企業）
  +0.8 if ROE > 15%       # 高い
  +0.5 if ROE > 10%       # 中程度
  0.0  if 5% <= ROE <= 10%  # 低め
  -0.5 if ROE < 5%        # 非常に低い
}
```

**解釈**:
- ROE > 15% = 経営効率が良い = 上昇ポテンシャル
- ROE < 5% = 経営効率が悪い = リスク

---

### 4.4 売上成長率 (Revenue Growth) 評価

```python
売上成長率 YoY = (Revenue[t] - Revenue[t-1y]) / Revenue[t-1y]

売上成長率 スコア = {
  +1.0 if Growth > 25%    # 非常に高い
  +0.8 if Growth > 15%    # 高い
  +0.5 if Growth > 5%     # 中程度
  0.0  if -5% <= Growth <= 5%  # フラット
  -0.5 if Growth < -5%    # マイナス成長
  -1.0 if Growth < -15%   # 急速衰退
}
```

**解釈**:
- 高い売上成長 = 事業拡大中 = 上昇のファンダメンタルズ
- マイナス成長 = 事業縮小 = 警戒必要

---

### 4.5 ファンダメンタルズスコア統合

```python
ファンダメンタルズスコア = 
  w_per × score_per +
  w_pbr × score_pbr +
  w_roe × score_roe +
  w_revenue_growth × score_revenue_growth

# デフォルト係数
w_per = 0.25
w_pbr = 0.15
w_roe = 0.35
w_revenue_growth = 0.25
```

**範囲**: -1.0 ～ +1.0

---

## 5. 統合スコア計算

### 5.1 複合スコア

```python
複合スコア = 
  w_technical × テクニカルスコア +
  w_fundamental × ファンダメンタルズスコア

# デフォルト係数
w_technical = 0.6      # 短期: テクニカル重視
w_fundamental = 0.4    # 中長期: ファンダメンタルズ

複合スコア の範囲: -1.0 ～ +1.0
```

---

### 5.2 正規化 (シグモイド変換)

```python
def sigmoid(x, scale=15.0):
    return 1 / (1 + exp(-scale * x))

確率(%) = sigmoid(複合スコア, scale) × 100

# scale パラメータ:
# - scale = 10: 緩やかなシグモイド（予測が0.5に偏る）
# - scale = 15: 標準（推奨）
# - scale = 20: 急峻（極端な0,100に偏る）
```

**シグモイド関数の特性**:
```
複合スコア = -1.0 → 確率 ≈ 0.1% (強気売り)
複合スコア = -0.5 → 確率 ≈ 12% (弱気)
複合スコア = 0.0  → 確率 = 50% (中立)
複合スコア = +0.5 → 確率 ≈ 88% (強気)
複合スコア = +1.0 → 確率 ≈ 99.9% (強気買い)
```

---

## 6. 予測上昇率計算

```python
予測上昇率(%) = 複合スコア × スケール係数

スケール係数 = 15.0 (デフォルト)

例:
- 複合スコア = +0.5 → 予測上昇率 = 7.5%
- 複合スコア = +0.8 → 予測上昇率 = 12.0%
- 複合スコア = +1.0 → 予測上昇率 = 15.0%
```

---

## 7. 実装例 (Python)

```python
import numpy as np
from scipy import stats

class StockPredictionAlgorithm:
    def __init__(self, coefficients=None):
        if coefficients is None:
            self.coefficients = self._default_coefficients()
        else:
            self.coefficients = coefficients
    
    @staticmethod
    def _default_coefficients():
        return {
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
    
    def calculate_technical_score(self, prices, volume):
        """テクニカルスコア計算"""
        scores = {}
        
        # SMA計算
        sma_5 = self._sma(prices, 5)
        sma_25 = self._sma(prices, 25)
        
        # SMA クロス
        if sma_5[-1] > sma_25[-1]:
            scores['sma_cross'] = 1.0
        elif sma_5[-1] < sma_25[-1]:
            scores['sma_cross'] = -1.0
        else:
            scores['sma_cross'] = 0.0
        
        # モメンタム (ROC 14日)
        roc_14 = (prices[-1] - prices[-14]) / prices[-14] * 100
        if roc_14 > 5:
            scores['momentum'] = 1.0
        elif roc_14 > 0:
            scores['momentum'] = 0.5
        elif roc_14 < -5:
            scores['momentum'] = -1.0
        else:
            scores['momentum'] = -0.5
        
        # 出来高
        avg_volume = np.mean(volume[-20:])
        if volume[-1] > avg_volume * 1.5:
            scores['volume'] = 1.0
        elif volume[-1] > avg_volume * 1.2:
            scores['volume'] = 0.3
        else:
            scores['volume'] = -0.5
        
        # 統合
        w = self.coefficients["technical"]
        technical_score = (
            w["sma_cross_weight"] * scores['sma_cross'] +
            w["momentum_weight"] * scores['momentum'] +
            w["volume_weight"] * scores['volume']
        )
        
        return np.clip(technical_score, -1.0, 1.0)
    
    def calculate_fundamental_score(self, per, pbr, roe, revenue_growth):
        """ファンダメンタルズスコア計算"""
        scores = {}
        
        # PER スコア
        if per < 12:
            scores['per'] = 1.0
        elif per < 15:
            scores['per'] = 0.8
        elif per < 20:
            scores['per'] = 0.5
        elif per <= 25:
            scores['per'] = 0.0
        elif per <= 35:
            scores['per'] = -0.3
        else:
            scores['per'] = -0.7
        
        # PBR スコア
        if pbr < 0.8:
            scores['pbr'] = 1.0
        elif pbr < 1.0:
            scores['pbr'] = 0.7
        elif pbr < 1.5:
            scores['pbr'] = 0.3
        elif pbr <= 2.0:
            scores['pbr'] = 0.0
        elif pbr <= 3.0:
            scores['pbr'] = -0.3
        else:
            scores['pbr'] = -0.7
        
        # ROE スコア
        if roe > 0.20:
            scores['roe'] = 1.0
        elif roe > 0.15:
            scores['roe'] = 0.8
        elif roe > 0.10:
            scores['roe'] = 0.5
        elif roe >= 0.05:
            scores['roe'] = 0.0
        else:
            scores['roe'] = -0.5
        
        # 売上成長率 スコア
        if revenue_growth > 0.25:
            scores['revenue_growth'] = 1.0
        elif revenue_growth > 0.15:
            scores['revenue_growth'] = 0.8
        elif revenue_growth > 0.05:
            scores['revenue_growth'] = 0.5
        elif revenue_growth >= -0.05:
            scores['revenue_growth'] = 0.0
        elif revenue_growth >= -0.15:
            scores['revenue_growth'] = -0.5
        else:
            scores['revenue_growth'] = -1.0
        
        # 統合
        w = self.coefficients["fundamental"]
        fundamental_score = (
            w["per_weight"] * scores['per'] +
            w["pbr_weight"] * scores['pbr'] +
            w["roe_weight"] * scores['roe'] +
            w["revenue_growth_weight"] * scores['revenue_growth']
        )
        
        return np.clip(fundamental_score, -1.0, 1.0)
    
    def calculate_composite_score(self, technical_score, fundamental_score):
        """複合スコア計算"""
        w_tech = self.coefficients["technical_weight"]
        w_fund = self.coefficients["fundamental_weight"]
        
        composite_score = (
            w_tech * technical_score +
            w_fund * fundamental_score
        )
        
        return np.clip(composite_score, -1.0, 1.0)
    
    def sigmoid(self, x):
        """シグモイド関数"""
        scale = self.coefficients.get("sigmoid_scale", 15.0)
        return 1.0 / (1.0 + np.exp(-scale * x))
    
    def predict(self, technical_score, fundamental_score):
        """確率と上昇率予測"""
        composite = self.calculate_composite_score(technical_score, fundamental_score)
        probability = self.sigmoid(composite) * 100
        predicted_return = composite * 15.0  # スケール係数
        
        return {
            'composite_score': composite,
            'probability_of_10pct_rise': probability,
            'predicted_return': predicted_return
        }
    
    @staticmethod
    def _sma(prices, period):
        """単純移動平均"""
        return np.convolve(prices, np.ones(period)/period, mode='valid')
```

---

## 8. バージョン管理

### 8.1 アルゴリズムバージョン

```
v1: 初期版
  - テクニカル + ファンダメンタルズ
  - 基本的な指標のみ

v2 (計画中): 機械学習版
  - Random Forest / XGBoost
  - 過去予測精度を学習
  - より複雑な特性抽出

v3 (計画中): 市場スタイル対応
  - 市場状況に応じた係数自動調整
  - ボラティリティ指数連動
```

---

## 9. バックテスト結果 (想定)

```
期間: 2023-01-01 ～ 2026-04-20
対象: 日本株 TOP100, 米国株 FAANG+50

正確率: ~68%
- 確率 > 75% の場合: 実績 + 8% 以上 = 72% 的中
- 確率 50-75% の場合: 実績 + 5% 以上 = 63% 的中
- 確率 < 50% の場合: 実績 - 5% 以下 = 65% 的中

シャープレシオ: 1.8
最大ドローダウン: -12%
```

---

## 10. 今後の改善予定

- [ ] ボラティリティ指数 (VIX/NVI) 連動
- [ ] セクター別権限調整
- [ ] 市場心理データ (恐怖指数) 統合
- [ ] ニュースセンチメント分析 (NLP)
- [ ] 複数タイムフレーム対応 (3日, 1週間, 1ヶ月)
- [ ] リアルタイム係数最適化 (ベイズ最適化)

