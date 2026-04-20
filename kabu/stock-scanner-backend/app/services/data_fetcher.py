import asyncio
import yfinance as yf
import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class DataFetcher:
    """株価・財務データ取得サービス"""
    
    # 日本株の銘柄リスト (Nikkei 225 代表)
    JPX_STOCKS = [
        "7203.T",   # トヨタ
        "7267.T",   # ホンダ
        "9984.T",   # ソフトバンク
        "6861.T",   # キーエンス
        "8035.T",   # 東京エレクトロン
        "9434.T",   # ソフトバンクグループ
        "4063.T",   # 信越化学
        "3382.T",   # セブン&アイ
        "8411.T",   # みずほ金融
        "6902.T",   # 電子ビーム技術研究所
        "4689.T",   # ズーム
        "6501.T",   # 日立製作所
        "8766.T",   # Yahoo!
        "9610.T",   # NTTドコモ
        "5108.T",   # ブリヂストン
    ]
    
    # 米国株の銘柄リスト (S&P 500 代表)
    NYSE_STOCKS = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
        "META", "TSLA", "BRK.B", "JNJ", "V",
        "WMT", "JPM", "DIS", "MCD", "NKE",
    ]
    
    @classmethod
    def get_stock_list(cls, market: str) -> List[str]:
        """市場別の銘柄リストを取得"""
        if market == "JPX":
            return cls.JPX_STOCKS
        elif market == "NYSE":
            return cls.NYSE_STOCKS
        else:
            raise ValueError(f"Unknown market: {market}")
    
    @staticmethod
    async def fetch_price_data(symbol: str, period: str = "1y") -> Optional[pd.DataFrame]:
        """
        株価データを取得 (yfinance)
        
        Args:
            symbol: 銘柄シンボル
            period: 期間 ('1y', '5y', 'max')
        
        Returns:
            OHLCV データフレーム
        """
        try:
            # yfinance は同期なので thread pool で実行
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(
                None,
                lambda: yf.download(symbol, period=period, progress=False)
            )
            
            if df.empty:
                logger.warning(f"No data for {symbol}")
                return None
            
            return df
        
        except Exception as e:
            logger.error(f"Error fetching {symbol}: {str(e)}")
            return None
    
    @staticmethod
    async def fetch_financial_data(symbol: str) -> Optional[Dict]:
        """
        財務データを取得 (PER, PBR, ROE など)
        
        Args:
            symbol: 銘柄シンボル
        
        Returns:
            財務指標の辞書
        """
        try:
            loop = asyncio.get_event_loop()
            
            ticker = await loop.run_in_executor(
                None,
                lambda: yf.Ticker(symbol)
            )
            
            # 基本情報を取得
            info = ticker.info
            
            return {
                "symbol": symbol,
                "company_name": info.get("longName", "N/A"),
                "current_price": info.get("currentPrice", 0),
                "per": info.get("trailingPE", None),
                "pbr": info.get("priceToBook", None),
                "roe": info.get("returnOnEquity", None),
                "revenue_growth": info.get("revenueGrowth", None),
                "market_cap": info.get("marketCap", None),
                "sector": info.get("sector", None),
            }
        
        except Exception as e:
            logger.error(f"Error fetching financial data for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def calculate_technical_indicators(df: pd.DataFrame, lookback: int = 60) -> Dict:
        """
        テクニカル指標を計算
        
        Args:
            df: OHLCV データフレーム
            lookback: 参照期間（営業日）
        
        Returns:
            テクニカル指標の辞書
        """
        if df is None or len(df) < lookback:
            return {}
        
        try:
            close = df['Close'].tail(lookback)
            
            # SMA
            sma_5 = close.rolling(5).mean().iloc[-1]
            sma_20 = close.rolling(20).mean().iloc[-1]
            sma_50 = close.rolling(50).mean().iloc[-1]
            sma_200 = close.rolling(200).mean().iloc[-1]
            
            # リターン
            return_1w = ((close.iloc[-1] - close.iloc[-5]) / close.iloc[-5] * 100) if len(close) > 5 else 0
            return_1m = ((close.iloc[-1] - close.iloc[-20]) / close.iloc[-20] * 100) if len(close) > 20 else 0
            return_6m = ((close.iloc[-1] - close.iloc[-120]) / close.iloc[-120] * 100) if len(close) > 120 else 0
            
            # 出来高
            volume = df['Volume'].tail(20)
            volume_ratio = df['Volume'].iloc[-1] / volume.mean() if volume.mean() > 0 else 1
            
            return {
                "sma_5": float(sma_5) if not pd.isna(sma_5) else None,
                "sma_20": float(sma_20) if not pd.isna(sma_20) else None,
                "sma_50": float(sma_50) if not pd.isna(sma_50) else None,
                "sma_200": float(sma_200) if not pd.isna(sma_200) else None,
                "return_1w": float(return_1w),
                "return_1m": float(return_1m),
                "return_6m": float(return_6m),
                "volume_ratio": float(volume_ratio),
                "current_price": float(close.iloc[-1]),
            }
        
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {str(e)}")
            return {}
    
    @staticmethod
    def get_historical_returns(df: pd.DataFrame, lookback: int = 60) -> np.ndarray:
        """
        過去リターン配列を取得 (正規化用)
        
        Args:
            df: OHLCV データフレーム
            lookback: 参照期間
        
        Returns:
            リターン配列 (%)
        """
        if df is None or len(df) < lookback:
            return np.array([])
        
        try:
            close = df['Close'].tail(lookback)
            returns = close.pct_change().dropna() * 100
            return returns.values
        
        except Exception as e:
            logger.error(f"Error getting historical returns: {str(e)}")
            return np.array([])
    
    @staticmethod
    def get_historical_pers(df: pd.DataFrame, symbol: str, lookback: int = 60) -> np.ndarray:
        """
        過去PER配列を取得 (yfinance から取得)
        
        Args:
            df: OHLCV データフレーム
            symbol: 銘柄シンボル
            lookback: 参照期間
        
        Returns:
            PER 配列
        """
        try:
            ticker = yf.Ticker(symbol)
            quarterly_financials = ticker.quarterly_financials
            
            if quarterly_financials is None or quarterly_financials.empty:
                return np.array([])
            
            net_income = quarterly_financials.loc['Net Income'].head(lookback // 60)
            shares_outstanding = ticker.info.get('sharesOutstanding', 1)
            
            if net_income.empty or shares_outstanding == 0:
                return np.array([])
            
            eps = net_income / shares_outstanding
            current_price = ticker.info.get('currentPrice', 1)
            
            pers = current_price / eps
            return pers.values
        
        except Exception as e:
            logger.warning(f"Could not get historical PERs for {symbol}: {str(e)}")
            return np.array([])


async def fetch_stock_data_parallel(
    symbols: List[str],
    period: str = "1y"
) -> Dict[str, Tuple[Optional[pd.DataFrame], Optional[Dict]]]:
    """
    複数銘柄のデータを並列取得
    
    Args:
        symbols: 銘柄シンボルリスト
        period: 期間
    
    Returns:
        {symbol: (price_df, financial_dict), ...}
    """
    tasks = [
        asyncio.gather(
            DataFetcher.fetch_price_data(symbol, period),
            DataFetcher.fetch_financial_data(symbol)
        )
        for symbol in symbols
    ]
    
    results = {}
    for symbol, (price_df, financial) in zip(symbols, await asyncio.gather(*tasks)):
        results[symbol] = (price_df, financial)
    
    return results
