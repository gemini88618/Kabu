from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal
from datetime import datetime


# ========== リクエスト/レスポンス ==========

class CoefficientInput(BaseModel):
    """係数入力モデル"""
    
    period: Literal["1w", "1m", "6m"]
    
    # モメンタムスコア重み
    w_ret: float = Field(0.5, ge=0, le=1, description="直近リターンの重み")
    w_sma: float = Field(0.3, ge=0, le=1, description="SMAクロスの重み")
    w_vol: float = Field(0.2, ge=0, le=1, description="出来高の重み")
    
    # バリュースコア重み
    w_per: float = Field(0.30, ge=0, le=1, description="PERの重み")
    w_pbr: float = Field(0.20, ge=0, le=1, description="PBRの重み")
    w_roe: float = Field(0.35, ge=0, le=1, description="ROEの重み")
    w_growth: float = Field(0.15, ge=0, le=1, description="成長率の重み")
    
    def validate_weights(self):
        """重みの合計が1に近いことを確認"""
        momentum_sum = self.w_ret + self.w_sma + self.w_vol
        value_sum = self.w_per + self.w_pbr + self.w_roe + self.w_growth
        
        if not (0.95 <= momentum_sum <= 1.05):
            raise ValueError(f"モメンタム重みの合計が不正: {momentum_sum}")
        if not (0.95 <= value_sum <= 1.05):
            raise ValueError(f"バリュー重みの合計が不正: {value_sum}")


class PredictionRequest(BaseModel):
    """予測リクエスト"""
    
    symbols: List[str] = Field(..., description="銘柄シンボル (例: ['7203.T', 'AAPL'])")
    period: Literal["1w", "1m", "6m"] = Field(..., description="投資期間")
    market: Literal["JPX", "NYSE"] = Field(..., description="市場")
    
    # オプション
    coefficients: Optional[CoefficientInput] = Field(None, description="カスタム係数")
    use_cache: bool = Field(True, description="キャッシュを使用")


class StockPredictionResult(BaseModel):
    """単一銘柄の予測結果"""
    
    symbol: str
    company_name: Optional[str]
    current_price: float
    probability: float  # 0-100
    recommendation: Literal["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"]
    momentum_score: float
    value_score: float
    composite_score: float
    target_return: float  # %
    
    # 詳細情報
    per: Optional[float] = None
    pbr: Optional[float] = None
    roe: Optional[float] = None
    revenue_growth: Optional[float] = None
    
    # 技術的詳細
    sma_5: Optional[float] = None
    sma_20: Optional[float] = None
    return_1w: Optional[float] = None
    volume_ratio: Optional[float] = None
    
    timestamp: datetime


class PredictionResponse(BaseModel):
    """予測レスポンス"""
    
    period: str
    target_return: float
    market: str
    timestamp: datetime
    total_stocks_analyzed: int
    
    top_stocks: List[StockPredictionResult] = Field(
        ..., 
        description="上昇確率が高い順にソートされたトップ10"
    )
    
    summary: Dict = Field(
        ..., 
        description="集計統計 (平均確率、推奨分布など)"
    )


# ========== バックテスト関連 ==========

class BacktestRequest(BaseModel):
    """バックテストリクエスト"""
    
    symbols: List[str] = Field(..., description="対象銘柄")
    period: Literal["1w", "1m", "6m"] = Field(..., description="投資期間")
    market: Literal["JPX", "NYSE"] = Field(..., description="市場")
    start_date: str = Field(..., description="開始日 (YYYY-MM-DD)")
    end_date: str = Field(..., description="終了日 (YYYY-MM-DD)")
    probability_threshold: float = Field(
        65, 
        ge=0, 
        le=100, 
        description="買いシグナルの確率閾値"
    )


class BacktestResult(BaseModel):
    """バックテスト結果"""
    
    symbol: str
    period: str
    total_signals: int
    hit_rate: float  # %
    average_return: float  # %
    win_rate: float  # %
    sharpe_ratio: float
    max_drawdown: float  # %
    total_return: float  # %
    
    signals: List[Dict] = Field(..., description="各シグナルの詳細")


class BacktestResponse(BaseModel):
    """バックテストレスポンス"""
    
    period: str
    market: str
    start_date: str
    end_date: str
    timestamp: datetime
    
    results: List[BacktestResult]
    
    summary: Dict = Field(
        ...,
        description="全体統計 (平均hit_rate, 平均 Sharpe など)"
    )


# ========== ヘルスチェック ==========

class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    
    status: str
    api_version: str
    timestamp: datetime
    environment: str = "development"


# ========== エラーレスポンス ==========

class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    
    error: str
    detail: Optional[str] = None
    timestamp: datetime
