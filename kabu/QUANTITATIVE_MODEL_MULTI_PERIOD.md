# 株価上昇確率予測アルゴリズム - マルチピリオド版

## 目的

複数の投資期間における株価上昇確率を予測する統合アルゴリズム

- **1週間以内**: 株価が10%以上上昇する確率
- **1ヶ月以内**: 株価が15%以上上昇する確率
- **半年以内**: 株価が30%以上上昇する確率

---

## 1. アルゴリズムの理論的基礎

### 1.1 背景と仮説

**主な仮説**：
1. 株価上昇の確率は**モメンタム効果**と**バリュー効果**の組み合わせで説明できる
2. **投資期間が短いほど**、テクニカル要因（モメンタム）が支配的
3. **投資期間が長いほど**、ファンダメンタルズ（バリュー）が支配的
4. マーケット・マイクロストラクチャ（出来高）が短期確率を調整

**期間別の効果の強さ**：
```
1週間:  モメンタム 70% + バリュー 30%  (テクニカル支配)
       → 短期トレンド、心理、出来高が重要

1ヶ月:  モメンタム 55% + バリュー 45%  (バランス型)
       → 中期トレンドと企業業績の開示

半年:   モメンタム 35% + バリュー 65%  (ファンダメンタルズ支配)
       → 企業の成長性、ROE、キャッシュフロー
```

**仮説根拠**：
- **Fama-French 3ファクターモデル**: 収益性、バリュー、サイズ
- **Carhart (1997)**: モメンタムファクターの検証
- **Moskowitz & Grinblatt (1999)**: 期間効果 (Horizon Effect)
- 実証的背景：短期リバーサル → 中期モメンタム → 長期リバーサル

### 1.2 期間別の特性

| 特性 | 1週間 | 1ヶ月 | 半年 |
|------|------|------|------|
| **支配要因** | テクニカル | 混在 | ファンダメンタルズ |
| **参照期間** | 5日-20日 | 20日-60日 | 60日-120日 |
| **リバーサル効果** | 強い | 弱い | 弱い |
| **モメンタム効果** | 中程度 | 強い | 弱い |
| **情報の役割** | 限定的 | 中程度 | 支配的 |
| **ノイズの影響** | 大きい | 中程度 | 小さい |

---

## 2. アルゴリズム構成

### 2.1 全体構造

```
入力データ (7指標) + 期間パラメータ
    ↓
┌──────────────────────────────────────┐
│ ステップ0: 期間別係数の決定         │
│ 入力: period ("1w", "1m", "6m")    │
│ 出力: w_momentum, w_value, scale    │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ ステップ1: 指標の正規化             │
│ - パーセンタイル正規化 [-1, 1]      │
│ - 期間別参照期間を適用              │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ ステップ2: スコア計算               │
│ ┌─────────────────────────────────┐  │
│ │ モメンタムスコア                │  │
│ │ ├─ 直近リターン (期間調整)     │  │
│ │ ├─ 移動平均クロス (期間別SMA) │  │
│ │ └─ 出来高変化率                │  │
│ └─────────────────────────────────┘  │
│ ┌─────────────────────────────────┐  │
│ │ バリュースコア                  │  │
│ │ ├─ PER, PBR, ROE, 売上成長率  │  │
│ │ └─ (期間が長いほど重要)         │  │
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ ステップ3: 統合スコア               │
│ モメンタム + バリュー (期間別重み) │
│ + リスク/市場調整                    │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ ステップ4: 確率変換                 │
│ シグモイド関数 (期間別スケール)    │
│ → 0-100% に変換                     │
└──────────────────────────────────────┘
    ↓
出力: 上昇確率 (%) [期間別]
```

### 2.2 期間別パラメータ定義

```python
PERIOD_CONFIG = {
    "1w": {
        "label": "1週間",
        "target_return": 10.0,              # 目標リターン (%)
        "lookback_days": 60,                # 参照期間 (日)
        "sma_short": 5,                     # 短期SMA
        "sma_long": 20,                     # 長期SMA
        "volume_lookback": 20,              # 出来高参照
        "w_momentum": 0.70,                 # モメンタム重み
        "w_value": 0.30,                    # バリュー重み
        "sigmoid_scale": 22.0,              # シグモイドスケール (極端)
        "return_lookback": 5,               # リターン参照 (営業日)
    },
    "1m": {
        "label": "1ヶ月",
        "target_return": 15.0,
        "lookback_days": 120,
        "sma_short": 15,
        "sma_long": 40,
        "volume_lookback": 30,
        "w_momentum": 0.55,
        "w_value": 0.45,
        "sigmoid_scale": 20.0,              # バランス
        "return_lookback": 20,
    },
    "6m": {
        "label": "半年",
        "target_return": 30.0,
        "lookback_days": 260,               # 約1年
        "sma_short": 50,
        "sma_long": 200,
        "volume_lookback": 60,
        "w_momentum": 0.35,
        "w_value": 0.65,                    # バリュー重視
        "sigmoid_scale": 18.0,              # 保守的
        "return_lookback": 120,
    }
}
```

---

## 3. 詳細な数式

### 3.1 正規化（期間別）

```
正規化方法: パーセンタイル正規化

p_i = (x_i - p25) / (p75 - p25)
ただし p_i を [-1, 1] にクリップ

参照期間:
- 1週間: 60日のローリング
- 1ヶ月: 120日のローリング  
- 半年: 260日のローリング (1年)

注: 異常値に強いため推奨
```

### 3.2 モメンタムスコア（期間別）

```
モメンタムスコア = w_ret × Score_ret 
                + w_sma × Score_sma 
                + w_vol × Score_vol

【1週間】
1) 直近リターン (5営業日)
   Score_ret = Clip(Return_5d / σ_5d, -1, 1)
   
2) 移動平均クロス
   SMA_5 vs SMA_20 を比較
   (短期トレンド変化を捉える)

3) 出来高
   高出来高: 短期買圧の信号

【1ヶ月】
1) 直近リターン (20営業日 = 約1ヶ月)
   Score_ret = Clip(Return_20d / σ_20d, -1, 1)
   
2) 移動平均クロス
   SMA_15 vs SMA_40 を比較
   (中期トレンド確認)
   
3) 出来高
   中程度の出来高: 機関投資家の関心

【半年】
1) 直近リターン (120営業日 = 約6ヶ月)
   Score_ret = Clip(Return_120d / σ_120d, -1, 1)
   
2) 移動平均クロス
   SMA_50 vs SMA_200 を比較
   (長期トレンド確認)
   
3) 出来高
   低出来高は重要性が低い
   (長期では日々の出来高は無関係)
```

### 3.3 バリュースコア（期間別重要性）

```
バリュースコア = w_per × Score_per 
               + w_pbr × Score_pbr 
               + w_roe × Score_roe 
               + w_growth × Score_growth

【1週間】
- PER:    20% (短期は限定的)
- PBR:    15%
- ROE:    30% (最重要)
- 成長率: 35% (サプライズ効果)

理由: 1週間では直近の業績サプライズが重要
     長期的な割安度は関係ない

【1ヶ月】
- PER:    35%
- PBR:    20%
- ROE:    25%
- 成長率: 20%

理由: バランス型
     企業業績の開示がある可能性

【半年】
- PER:    30% (最重要: 割安度)
- PBR:    25% (資産価値)
- ROE:    25% (経営効率の持続性)
- 成長率: 20% (長期成長率)

理由: 長期ではバリューが支配的
     割安株の上昇が見込まれる
```

### 3.4 統合スコア（期間別）

```
複合スコア = w_momentum × Momentum_Score 
          + w_value × Value_Score
          + Adjustment_term

期間別重み:

【1週間】
  w_momentum = 0.70 (テクニカルが支配的)
  w_value = 0.30

【1ヶ月】
  w_momentum = 0.55 (バランス)
  w_value = 0.45

【半年】
  w_momentum = 0.35 (ファンダメンタル支配)
  w_value = 0.65

調整項: 全期間共通
  - リスク調整: ボラティリティ > 90th → -0.2
  - 市場適応: Risk-on (+0.1) / Risk-off (-0.1)

最終: 複合スコア = Clip(複合スコア, -1, 1)
```

### 3.5 確率変換（期間別シグモイド）

```
最終確率 = Sigmoid(複合スコア × scale) × 100

Sigmoid(x) = 1 / (1 + exp(-x))

スケール係数 (期間別):

【1週間】
  scale = 22.0 (極端: より0/100に寄る)
  理由: ノイズが多いため確信度は極端
  
【1ヶ月】
  scale = 20.0 (標準)
  理由: バランス型

【半年】
  scale = 18.0 (保守的: より50%に寄る)
  理由: 長期では予測が難しい

変換例 (1週間):
  複合スコア = -1.0  → 確率 ≈ 0.03%  (強気売り)
  複合スコア = -0.5  → 確率 ≈ 2.7%   (弱気)
  複合スコア =  0.0  → 確率 = 50%    (中立)
  複合スコア = +0.5  → 確率 ≈ 97.3%  (強気)
  複合スコア = +1.0  → 確率 ≈ 99.97% (強気買い)

変換例 (半年):
  複合スコア = -1.0  → 確率 ≈ 0.1%   (信頼度低)
  複合スコア = -0.5  → 確率 ≈ 5.3%   (弱気)
  複合スコア =  0.0  → 確率 = 50%    (中立)
  複合スコア = +0.5  → 確率 ≈ 94.7%  (強気)
  複合スコア = +1.0  → 確率 ≈ 99.9%  (確信度高)
```

---

## 4. Python実装（マルチピリオド版）

### 4.1 基本実装

```python
import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Dict, Optional, Literal

# 期間別設定
PERIOD_CONFIG = {
    "1w": {
        "label": "1週間",
        "target_return": 10.0,
        "lookback_days": 60,
        "sma_short": 5,
        "sma_long": 20,
        "volume_lookback": 20,
        "w_momentum": 0.70,
        "w_value": 0.30,
        "sigmoid_scale": 22.0,
        "return_lookback": 5,
    },
    "1m": {
        "label": "1ヶ月",
        "target_return": 15.0,
        "lookback_days": 120,
        "sma_short": 15,
        "sma_long": 40,
        "volume_lookback": 30,
        "w_momentum": 0.55,
        "w_value": 0.45,
        "sigmoid_scale": 20.0,
        "return_lookback": 20,
    },
    "6m": {
        "label": "半年",
        "target_return": 30.0,
        "lookback_days": 260,
        "sma_short": 50,
        "sma_long": 200,
        "volume_lookback": 60,
        "w_momentum": 0.35,
        "w_value": 0.65,
        "sigmoid_scale": 18.0,
        "return_lookback": 120,
    }
}

@dataclass
class AlgorithmCoefficients:
    """アルゴリズムの係数を管理するクラス"""
    
    period: Literal["1w", "1m", "6m"] = "1m"
    
    # モメンタムスコアの重み
    w_ret: float = 0.5
    w_sma: float = 0.3
    w_vol: float = 0.2
    
    # バリュースコアの重み
    w_per: float = 0.30
    w_pbr: float = 0.20
    w_roe: float = 0.35
    w_growth: float = 0.15
    
    # SMA乖離率
    sma_upper_threshold: float = 1.02
    sma_lower_threshold: float = 0.98
    
    # 出来高比率の閾値
    vol_high_ratio: float = 1.5
    vol_medium_ratio: float = 1.2
    vol_low_ratio: float = 0.8
    vol_very_low_ratio: float = 0.5
    
    def __post_init__(self):
        """期間別設定を適用"""
        period_config = PERIOD_CONFIG[self.period]
        self.target_return = period_config["target_return"]
        self.w_momentum = period_config["w_momentum"]
        self.w_value = period_config["w_value"]
        self.sigmoid_scale = period_config["sigmoid_scale"]


class MultiPeriodStockPrediction:
    """
    マルチピリオド株価上昇確率予測モデル
    
    3つの投資期間 (1週間、1ヶ月、半年) をサポート
    """
    
    def __init__(self, period: Literal["1w", "1m", "6m"] = "1m"):
        """
        Args:
            period: 投資期間 ("1w", "1m", "6m")
        """
        self.period = period
        self.config = PERIOD_CONFIG[period]
        self.coeffs = AlgorithmCoefficients(period=period)
    
    # ========== 正規化 ==========
    
    @staticmethod
    def normalize_percentile(value: float, data: np.ndarray,
                            lower_percentile: float = 25,
                            upper_percentile: float = 75) -> float:
        """パーセンタイル正規化"""
        p_lower = np.percentile(data, lower_percentile)
        p_upper = np.percentile(data, upper_percentile)
        
        if p_upper == p_lower:
            return 0.0
        
        normalized = (value - p_lower) / (p_upper - p_lower) - 0.5
        return np.clip(normalized * 2, -1, 1)
    
    # ========== モメンタムスコア ==========
    
    def calculate_return_score(self, historical_returns: np.ndarray) -> float:
        """期間別リターンスコア"""
        if len(historical_returns) == 0:
            return 0.0
        
        current_return = historical_returns[-1]
        mean = np.mean(historical_returns)
        std = np.std(historical_returns)
        
        if std == 0:
            return 0.0
        
        z_score = (current_return - mean) / std
        return np.clip(z_score, -1, 1)
    
    def calculate_sma_score(self, sma_short: float, sma_long: float) -> float:
        """期間別SMAクロススコア"""
        if sma_long == 0:
            return 0.0
        
        ratio = sma_short / sma_long
        
        if ratio > self.coeffs.sma_upper_threshold:
            return 1.0
        elif ratio > 1.0:
            return 0.5
        elif ratio > self.coeffs.sma_lower_threshold:
            return 0.0
        elif ratio > self.coeffs.sma_lower_threshold - 0.02:
            return -0.5
        else:
            return -1.0
    
    def calculate_volume_score(self, volume_ratio: float,
                              sma_short: float, sma_long: float) -> float:
        """期間別出来高スコア"""
        is_uptrend = sma_short > sma_long
        
        if volume_ratio > self.coeffs.vol_high_ratio:
            return 0.8 if is_uptrend else 0.2
        elif volume_ratio > self.coeffs.vol_medium_ratio:
            return 0.4 if is_uptrend else 0.1
        elif volume_ratio > self.coeffs.vol_low_ratio:
            return 0.0
        elif volume_ratio > self.coeffs.vol_very_low_ratio:
            return -0.4
        else:
            return -0.8 if self.period != "6m" else -0.3
    
    def calculate_momentum_score(self, 
                                return_data: np.ndarray,
                                sma_short: float,
                                sma_long: float,
                                volume_ratio: float) -> float:
        """統合モメンタムスコア"""
        score_ret = self.calculate_return_score(return_data)
        score_sma = self.calculate_sma_score(sma_short, sma_long)
        score_vol = self.calculate_volume_score(volume_ratio, sma_short, sma_long)
        
        momentum_score = (
            self.coeffs.w_ret * score_ret +
            self.coeffs.w_sma * score_sma +
            self.coeffs.w_vol * score_vol
        )
        
        return np.clip(momentum_score, -1, 1)
    
    # ========== バリュースコア ==========
    
    def calculate_per_score(self, per: float, historical_pers: np.ndarray) -> float:
        """PERスコア"""
        return self.normalize_percentile(per, historical_pers)
    
    def calculate_pbr_score(self, pbr: float) -> float:
        """PBRスコア"""
        if pbr < 1.0:
            return 1.0
        elif pbr < 1.5:
            return 0.7
        elif pbr < 2.0:
            return 0.3
        elif pbr < 3.0:
            return 0.0
        elif pbr < 4.0:
            return -0.3
        else:
            return -0.8
    
    def calculate_roe_score(self, roe: float) -> float:
        """ROEスコア"""
        if roe > 20:
            return 1.0
        elif roe > 15:
            return 0.8
        elif roe > 10:
            return 0.5
        elif roe >= 5:
            return 0.0
        elif roe > 0:
            return -0.5
        else:
            return -1.0
    
    def calculate_growth_score(self, growth_rate: float) -> float:
        """売上成長率スコア"""
        if growth_rate > 25:
            return 1.0
        elif growth_rate > 15:
            return 0.8
        elif growth_rate > 5:
            return 0.5
        elif growth_rate >= -5:
            return 0.0
        elif growth_rate > -10:
            return -0.3
        elif growth_rate > -20:
            return -0.8
        else:
            return -1.0
    
    def calculate_value_score(self, 
                             per: float, pbr: float,
                             roe: float, growth_rate: float,
                             historical_pers: np.ndarray) -> float:
        """統合バリュースコア"""
        score_per = self.calculate_per_score(per, historical_pers)
        score_pbr = self.calculate_pbr_score(pbr)
        score_roe = self.calculate_roe_score(roe)
        score_growth = self.calculate_growth_score(growth_rate)
        
        value_score = (
            self.coeffs.w_per * score_per +
            self.coeffs.w_pbr * score_pbr +
            self.coeffs.w_roe * score_roe +
            self.coeffs.w_growth * score_growth
        )
        
        return np.clip(value_score, -1, 1)
    
    # ========== 統合スコア ==========
    
    def calculate_composite_score(self, 
                                 momentum_score: float,
                                 value_score: float,
                                 volatility: Optional[float] = None,
                                 market_regime: str = "Neutral") -> float:
        """統合スコア（期間別重み適用）"""
        composite = (
            self.coeffs.w_momentum * momentum_score +
            self.coeffs.w_value * value_score
        )
        
        if volatility is not None and volatility > 30:
            composite -= 0.2
        
        if market_regime == "Risk-on":
            composite += 0.1
        elif market_regime == "Risk-off":
            composite -= 0.1
        
        return np.clip(composite, -1, 1)
    
    # ========== 確率変換 ==========
    
    @staticmethod
    def sigmoid(x: float) -> float:
        """シグモイド関数"""
        return 1.0 / (1.0 + np.exp(-x))
    
    def calculate_probability(self, composite_score: float) -> float:
        """複合スコアを確率に変換（期間別スケール適用）"""
        probability = self.sigmoid(composite_score * self.coeffs.sigmoid_scale)
        return probability * 100
    
    # ========== 統合予測メソッド ==========
    
    def predict(self,
               return_data: np.ndarray,
               sma_short: float,
               sma_long: float,
               volume_ratio: float,
               per: float,
               pbr: float,
               roe: float,
               growth_rate: float,
               historical_pers: np.ndarray,
               volatility: Optional[float] = None,
               market_regime: str = "Neutral") -> Dict:
        """
        株価上昇確率を予測
        
        Returns:
            {
              'period': 投資期間,
              'target_return': 目標リターン (%),
              'probability': 上昇確率 (%),
              'momentum_score': モメンタムスコア,
              'value_score': バリュースコア,
              'composite_score': 複合スコア,
              'recommendation': 推奨格付け,
              'details': {詳細情報}
            }
        """
        momentum_score = self.calculate_momentum_score(
            return_data, sma_short, sma_long, volume_ratio
        )
        value_score = self.calculate_value_score(
            per, pbr, roe, growth_rate, historical_pers
        )
        composite_score = self.calculate_composite_score(
            momentum_score, value_score, volatility, market_regime
        )
        probability = self.calculate_probability(composite_score)
        
        # 期間別の推奨格付け（異なる閾値）
        if self.period == "1w":
            thresholds = [80, 65, 50, 35]
        elif self.period == "1m":
            thresholds = [75, 60, 50, 40]
        else:  # 6m
            thresholds = [70, 55, 50, 45]
        
        if probability >= thresholds[0]:
            recommendation = "Strong Buy"
        elif probability >= thresholds[1]:
            recommendation = "Buy"
        elif probability >= thresholds[2]:
            recommendation = "Hold"
        elif probability >= thresholds[3]:
            recommendation = "Sell"
        else:
            recommendation = "Strong Sell"
        
        return {
            'period': self.config['label'],
            'target_return': self.config['target_return'],
            'probability': probability,
            'momentum_score': momentum_score,
            'value_score': value_score,
            'composite_score': composite_score,
            'recommendation': recommendation,
            'details': {
                'threshold_strong_buy': thresholds[0],
                'threshold_buy': thresholds[1],
                'threshold_hold': thresholds[2],
                'threshold_sell': thresholds[3],
            }
        }


def multi_period_predict(return_data: np.ndarray,
                        sma_short_1w: float, sma_long_1w: float,
                        sma_short_1m: float, sma_long_1m: float,
                        sma_short_6m: float, sma_long_6m: float,
                        volume_ratio: float,
                        per: float, pbr: float,
                        roe: float, growth_rate: float,
                        historical_pers: np.ndarray,
                        volatility: Optional[float] = None,
                        market_regime: str = "Neutral") -> Dict[str, Dict]:
    """
    3期間すべての予測を実行
    
    Returns:
        {
          '1w': 1週間予測,
          '1m': 1ヶ月予測,
          '6m': 半年予測
        }
    """
    results = {}
    
    for period in ["1w", "1m", "6m"]:
        model = MultiPeriodStockPrediction(period=period)
        
        # 期間別SMAを選択
        if period == "1w":
            sma_short, sma_long = sma_short_1w, sma_long_1w
        elif period == "1m":
            sma_short, sma_long = sma_short_1m, sma_long_1m
        else:  # 6m
            sma_short, sma_long = sma_short_6m, sma_long_6m
        
        results[period] = model.predict(
            return_data=return_data[-model.config['lookback_days']:],
            sma_short=sma_short,
            sma_long=sma_long,
            volume_ratio=volume_ratio,
            per=per,
            pbr=pbr,
            roe=roe,
            growth_rate=growth_rate,
            historical_pers=historical_pers,
            volatility=volatility,
            market_regime=market_regime
        )
    
    return results
```

### 4.2 使用例

```python
import numpy as np

# 過去データの例
historical_returns = np.array([1.2, -0.5, 2.3, -1.1, 0.8, 1.5, -0.3, 2.1,
                               0.9, -0.7, 1.3, 0.5, -1.2, 2.0, 0.6, 1.1])
historical_pers = np.array([15.2, 15.5, 15.1, 15.8, 16.0, 15.3, 15.7, 16.2,
                             15.9, 16.1, 15.4, 16.3, 15.6, 16.5, 15.8, 16.7])

# ========== 1週間の予測 ==========
model_1w = MultiPeriodStockPrediction(period="1w")
result_1w = model_1w.predict(
    return_data=historical_returns,
    sma_short=2450,
    sma_long=2420,
    volume_ratio=1.3,
    per=11.5,
    pbr=0.95,
    roe=12.5,
    growth_rate=8.2,
    historical_pers=historical_pers,
    volatility=20.5,
    market_regime="Risk-on"
)

print("【1週間予測】")
print(f"上昇確率: {result_1w['probability']:.1f}%")
print(f"推奨: {result_1w['recommendation']}")
print(f"目標リターン: +{result_1w['target_return']:.0f}%")

# ========== 1ヶ月の予測 ==========
model_1m = MultiPeriodStockPrediction(period="1m")
result_1m = model_1m.predict(
    return_data=historical_returns,
    sma_short=2435,
    sma_long=2410,
    volume_ratio=1.1,
    per=11.5,
    pbr=0.95,
    roe=12.5,
    growth_rate=8.2,
    historical_pers=historical_pers,
    volatility=18.0,
    market_regime="Risk-on"
)

print("\n【1ヶ月予測】")
print(f"上昇確率: {result_1m['probability']:.1f}%")
print(f"推奨: {result_1m['recommendation']}")
print(f"目標リターン: +{result_1m['target_return']:.0f}%")

# ========== 半年の予測 ==========
model_6m = MultiPeriodStockPrediction(period="6m")
result_6m = model_6m.predict(
    return_data=historical_returns,
    sma_short=2400,
    sma_long=2380,
    volume_ratio=1.0,
    per=11.5,
    pbr=0.95,
    roe=12.5,
    growth_rate=8.2,
    historical_pers=historical_pers,
    volatility=15.0,
    market_regime="Risk-on"
)

print("\n【半年予測】")
print(f"上昇確率: {result_6m['probability']:.1f}%")
print(f"推奨: {result_6m['recommendation']}")
print(f"目標リターン: +{result_6m['target_return']:.0f}%")

# ========== 3期間同時予測 ==========
multi_results = multi_period_predict(
    return_data=historical_returns,
    sma_short_1w=2450, sma_long_1w=2420,
    sma_short_1m=2435, sma_long_1m=2410,
    sma_short_6m=2400, sma_long_6m=2380,
    volume_ratio=1.3,
    per=11.5, pbr=0.95,
    roe=12.5, growth_rate=8.2,
    historical_pers=historical_pers,
    volatility=18.0,
    market_regime="Risk-on"
)

print("\n【マルチピリオド結果】")
for period in ["1w", "1m", "6m"]:
    result = multi_results[period]
    print(f"{result['period']}: {result['probability']:.1f}% → {result['recommendation']}")
```

---

## 5. 期間別の指標説明

### 5.1 リターン（期間調整）

| 期間 | 参照期間 | 計算方法 | 意味 |
|------|---------|---------|------|
| **1週間** | 5営業日 | (P_now - P_5d) / P_5d | 短期心理 |
| **1ヶ月** | 20営業日 | (P_now - P_20d) / P_20d | 中期トレンド |
| **半年** | 120営業日 | (P_now - P_120d) / P_120d | 長期成長 |

### 5.2 移動平均（期間別SMA）

| 期間 | 短期SMA | 長期SMA | 用途 |
|------|---------|---------|------|
| **1週間** | 5日 | 20日 | 短期トレンド反転 |
| **1ヶ月** | 15日 | 40日 | 中期トレンド確認 |
| **半年** | 50日 | 200日 | 長期トレンド (Golden Cross) |

### 5.3 バリュー指標の重要性

```
指標       1週間  1ヶ月  半年
─────────────────────────
PER       20%   35%   30%  (期間中盤が最重要)
PBR       15%   20%   25%  (長期になほど重要)
ROE       30%   25%   25%  (最重要指標)
成長率    35%   20%   20%  (短期サプライズ)
```

---

## 6. 改善案・拡張可能性

### 6.1 セクター別係数調整

```python
SECTOR_ADJUSTMENTS = {
    'Technology': {'1w': 0.75, '1m': 0.60, '6m': 0.30},  # テックはモメンタム強気
    'Healthcare': {'1w': 0.65, '1m': 0.55, '6m': 0.40},
    'Finance': {'1w': 0.70, '1m': 0.50, '6m': 0.35},
    'Utilities': {'1w': 0.40, '1m': 0.45, '6m': 0.65},  # ユーティリティはバリュー重視
}
```

### 6.2 市場別係数調整

```python
MARKET_ADJUSTMENTS = {
    'JPX': {'1w': 0.70, '1m': 0.55, '6m': 0.35},  # 日本
    'NYSE': {'1w': 0.68, '1m': 0.56, '6m': 0.36}, # 米国
}
```

### 6.3 マクロ経済指標の組み込み

```
VIX水準による調整:
- VIX > 25 (恐怖): 係数を保守的に → より50%に寄る
- VIX < 12 (贪欲): 係数を積極的に → より0/100に寄る

金利環境による調整:
- 金利上昇時: バリュー比率を増加 (割安性が増す)
- 金利低下時: モメンタム比率を増加 (成長期待)
```

---

## 7. よくある質問

### Q1: 3期間の結果が矛盾する場合は?

**A**: 完全に矛盾することは稀です。通常:
```
例1: 1週間 80% → 1ヶ月 65% → 半年 45%
→ 短期的な買圧があるが、中期的には調整の可能性

例2: 1週間 30% → 1ヶ月 55% → 半年 75%
→ 短期は売られすぎ、中長期では成長期待

推奨: 投資期間に応じて使い分け
```

### Q2: どの期間を重視すべき?

**A**: 投資スタイルによる:
```
デイトレ・スイング → 1週間を重視
短期投資 (1-3ヶ月) → 1ヶ月を重視
中期投資 (6-12ヶ月) → 半年を重視
ポートフォリオ → 半年を重視、1ヶ月で定期調整
```

### Q3: 目標リターンの根拠は?

**A**: 統計的背景:
```
1週間の +10%: 5営業日で10%上昇は稀 (約5-10%の確率)
1ヶ月の +15%: 1ヶ月で15%上昇は可能 (約10-15%)
半年の +30%: 半年で30%上昇は妥当 (インフレ+成長)
```

### Q4: 係数は固定すべき?

**A**: 理想は定期的に最適化:
```
推奨: 
- 月1回: バックテストで係数を再計算
- 年1回: 完全な再評価
- 市場転換時: 即座に調整
```

