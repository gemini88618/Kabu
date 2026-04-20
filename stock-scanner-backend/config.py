import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # API設定
    API_TITLE: str = "Stock Scanner API"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # バックエンド URL（開発時は localhost）
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # CORS設定
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    
    # 本番環境用 (Vercel + Render)
    if os.getenv("ENVIRONMENT") == "production":
        ALLOWED_ORIGINS.extend([
            "https://stock-scanner.vercel.app",
            "https://stock-scanner-api.onrender.com",
        ])
    
    # データ取得設定
    DATA_CACHE_DAYS: int = 1
    MAX_STOCKS_PER_MARKET: int = 500  # 最大スクリーニング対象
    
    # 期間設定
    PERIODS_1W = [
        "past-3w-2w",
        "past-2w-1w", 
        "past-1w-now",
        "now-1w-future"
    ]
    
    PERIODS_1M = [
        "past-3m-2m",
        "past-2m-1m",
        "past-1m-now",
        "now-1m-future"
    ]
    
    PERIODS_6M = [
        "past-1y-6m",
        "past-6m-now",
        "now-6m-future"
    ]
    
    # デフォルト係数
    DEFAULT_COEFFICIENTS = {
        "1w": {
            "w_momentum": 0.70,
            "w_value": 0.30,
            "w_ret": 0.5,
            "w_sma": 0.3,
            "w_vol": 0.2,
            "w_per": 0.20,
            "w_pbr": 0.15,
            "w_roe": 0.30,
            "w_growth": 0.35,
        },
        "1m": {
            "w_momentum": 0.55,
            "w_value": 0.45,
            "w_ret": 0.5,
            "w_sma": 0.3,
            "w_vol": 0.2,
            "w_per": 0.35,
            "w_pbr": 0.20,
            "w_roe": 0.25,
            "w_growth": 0.20,
        },
        "6m": {
            "w_momentum": 0.35,
            "w_value": 0.65,
            "w_ret": 0.5,
            "w_sma": 0.3,
            "w_vol": 0.2,
            "w_per": 0.30,
            "w_pbr": 0.25,
            "w_roe": 0.25,
            "w_growth": 0.20,
        }
    }
    
    # バックテスト設定
    BACKTEST_START_DATE: str = "2022-01-01"
    BACKTEST_END_DATE: str = "2024-12-31"
    MIN_HISTORICAL_DAYS: int = 260  # 1年
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """設定を取得（キャッシュ）"""
    return Settings()
