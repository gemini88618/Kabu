import numpy as np
import pandas as pd
from typing import Dict, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


# 期間別設定
PERIOD_CONFIG = {
    "1w": {
        "target_return": 10.0,
        "lookback_days": 60,
        "sma_short": 5,
        "sma_long": 20,
        "w_momentum": 0.70,
        "w_value": 0.30,
        "sigmoid_scale": 22.0,
        "return_lookback": 5,
    },
    "1m": {
        "target_return": 15.0,
        "lookback_days": 120,
        "sma_short": 15,
        "sma_long": 40,
        "w_momentum": 0.55,
        "w_value": 0.45,
        "sigmoid_scale": 20.0,
        "return_lookback": 20,
    },
    "6m": {
        "target_return": 30.0,
        "lookback_days": 260,
        "sma_short": 50,
        "sma_long": 200,
        "w_momentum": 0.35,
        "w_value": 0.65,
        "sigmoid_scale": 18.0,
        "return_lookback": 120,
    }
}


@dataclass
class AlgorithmCoefficients:
    """アルゴリズム係数"""
    
    period: str
    w_ret: float = 0.5
    w_sma: float = 0.3
    w_vol: float = 0.2
    w_per: float = 0.30
    w_pbr: float = 0.20
    w_roe: float = 0.35
    w_growth: float = 0.15
    sma_upper_threshold: float = 1.02
    sma_lower_threshold: float = 0.98
    vol_high_ratio: float = 1.5
    vol_medium_ratio: float = 1.2
    vol_low_ratio: float = 0.8
    vol_very_low_ratio: float = 0.5


class MultiPeriodStockPrediction:
    """マルチピリオド株価上昇確率予測モデル"""
    
    def __init__(self, period: str, coefficients: Optional[Dict] = None):
        """
        Args:
            period: '1w', '1m', '6m'
            coefficients: カスタム係数
        """
        self.period = period
        self.config = PERIOD_CONFIG[period]
        
        # デフォルト係数またはカスタム係数
        coeff_dict = coefficients or {}
        self.coeffs = AlgorithmCoefficients(
            period=period,
            w_ret=coeff_dict.get('w_ret', 0.5),
            w_sma=coeff_dict.get('w_sma', 0.3),
            w_vol=coeff_dict.get('w_vol', 0.2),
            w_per=coeff_dict.get('w_per', 0.30),
            w_pbr=coeff_dict.get('w_pbr', 0.20),
            w_roe=coeff_dict.get('w_roe', 0.35),
            w_growth=coeff_dict.get('w_growth', 0.15),
        )
    
    # ========== 正規化 ==========
    
    @staticmethod
    def normalize_percentile(value: float, data: np.ndarray,
                            lower_percentile: float = 25,
                            upper_percentile: float = 75) -> float:
        """パーセンタイル正規化"""
        if len(data) == 0 or np.all(np.isnan(data)):
            return 0.0
        
        data_clean = data[~np.isnan(data)]
        if len(data_clean) == 0:
            return 0.0
        
        p_lower = np.percentile(data_clean, lower_percentile)
        p_upper = np.percentile(data_clean, upper_percentile)
        
        if p_upper == p_lower:
            return 0.0
        
        normalized = (value - p_lower) / (p_upper - p_lower) - 0.5
        return np.clip(normalized * 2, -1, 1)
    
    # ========== モメンタムスコア ==========
    
    def calculate_return_score(self, historical_returns: np.ndarray) -> float:
        """リターンスコア"""
        if len(historical_returns) == 0:
            return 0.0
        
        returns_clean = historical_returns[~np.isnan(historical_returns)]
        if len(returns_clean) == 0:
            return 0.0
        
        current_return = returns_clean[-1]
        mean = np.mean(returns_clean)
        std = np.std(returns_clean)
        
        if std == 0:
            return 0.0
        
        z_score = (current_return - mean) / std
        return np.clip(z_score, -1, 1)
    
    def calculate_sma_score(self, sma_short: float, sma_long: float) -> float:
        """SMAクロススコア"""
        if sma_long == 0 or np.isnan(sma_short) or np.isnan(sma_long):
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
        """出来高スコア"""
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
    
    def calculate_per_score(self, per: Optional[float],
                           historical_pers: np.ndarray) -> float:
        """PERスコア"""
        if per is None or np.isnan(per):
            return 0.0
        
        return self.normalize_percentile(per, historical_pers)
    
    def calculate_pbr_score(self, pbr: Optional[float]) -> float:
        """PBRスコア"""
        if pbr is None or np.isnan(pbr):
            return 0.0
        
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
    
    def calculate_roe_score(self, roe: Optional[float]) -> float:
        """ROEスコア"""
        if roe is None or np.isnan(roe):
            return 0.0
        
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
    
    def calculate_growth_score(self, growth_rate: Optional[float]) -> float:
        """売上成長率スコア"""
        if growth_rate is None or np.isnan(growth_rate):
            return 0.0
        
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
                             per: Optional[float],
                             pbr: Optional[float],
                             roe: Optional[float],
                             growth_rate: Optional[float],
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
            self.config['w_momentum'] * momentum_score +
            self.config['w_value'] * value_score
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
        # オーバーフロー対策
        if x > 500:
            return 1.0
        elif x < -500:
            return 0.0
        return 1.0 / (1.0 + np.exp(-x))
    
    def calculate_probability(self, composite_score: float) -> float:
        """複合スコアを確率に変換"""
        probability = self.sigmoid(
            composite_score * self.config['sigmoid_scale']
        )
        return probability * 100
    
    # ========== 統合予測 ==========
    
    def predict(self,
               return_data: np.ndarray,
               sma_short: float,
               sma_long: float,
               volume_ratio: float,
               per: Optional[float],
               pbr: Optional[float],
               roe: Optional[float],
               growth_rate: Optional[float],
               historical_pers: np.ndarray,
               volatility: Optional[float] = None,
               market_regime: str = "Neutral") -> Dict:
        """株価上昇確率を予測"""
        
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
        
        # 期間別の推奨格付け閾値
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
            'period': self.period,
            'target_return': self.config['target_return'],
            'probability': probability,
            'momentum_score': float(momentum_score),
            'value_score': float(value_score),
            'composite_score': float(composite_score),
            'recommendation': recommendation,
            'thresholds': {
                'strong_buy': thresholds[0],
                'buy': thresholds[1],
                'hold': thresholds[2],
                'sell': thresholds[3],
            }
        }
