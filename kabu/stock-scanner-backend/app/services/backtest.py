import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import logging
from app.services.prediction import MultiPeriodStockPrediction
from app.services.data_fetcher import DataFetcher

logger = logging.getLogger(__name__)


class BacktestEngine:
    """バックテストエンジン"""
    
    @staticmethod
    def calculate_targets_for_period(price_data: pd.Series, 
                                     period: str,
                                     target_return: float) -> np.ndarray:
        """
        期間別の目標達成フラグを計算
        
        Args:
            price_data: 株価時系列
            period: '1w', '1m', '6m'
            target_return: 目標リターン (%)
        
        Returns:
            各日が目標達成しているフラグ配列
        """
        if period == "1w":
            lookforward = 5  # 5営業日
        elif period == "1m":
            lookforward = 20  # 約1ヶ月
        else:  # 6m
            lookforward = 120  # 約半年
        
        targets = np.zeros(len(price_data), dtype=int)
        
        for i in range(len(price_data) - lookforward):
            current_price = price_data.iloc[i]
            future_price = price_data.iloc[i + lookforward]
            return_pct = ((future_price - current_price) / current_price) * 100
            
            if return_pct >= target_return:
                targets[i] = 1
        
        return targets
    
    @staticmethod
    def backtest_single_stock(symbol: str,
                             period: str,
                             start_date: str,
                             end_date: str,
                             probability_threshold: float = 65.0,
                             coefficients: Optional[Dict] = None) -> Dict:
        """
        単一銘柄のバックテスト
        
        Args:
            symbol: 銘柄シンボル
            period: '1w', '1m', '6m'
            start_date: 開始日 (YYYY-MM-DD)
            end_date: 終了日 (YYYY-MM-DD)
            probability_threshold: 買いシグナル確率閾値
            coefficients: カスタム係数
        
        Returns:
            バックテスト結果
        """
        try:
            # データ取得
            price_data = yf.download(
                symbol,
                start=start_date,
                end=end_date,
                progress=False
            )
            
            if price_data.empty or len(price_data) < 100:
                logger.warning(f"Insufficient data for {symbol}")
                return {
                    'symbol': symbol,
                    'period': period,
                    'error': 'Insufficient historical data',
                    'total_signals': 0,
                }
            
            # 目標フラグを計算
            from app.services.prediction import PERIOD_CONFIG
            target_return = PERIOD_CONFIG[period]['target_return']
            targets = BacktestEngine.calculate_targets_for_period(
                price_data['Close'],
                period,
                target_return
            )
            
            # 予測モデルを初期化
            model = MultiPeriodStockPrediction(period, coefficients)
            
            # シグナル生成とバックテスト実行
            signals = []
            predictions = []
            
            for i in range(60, len(price_data) - 20):
                # 過去データを取得
                lookback = PERIOD_CONFIG[period]['lookback_days']
                hist_data = price_data.iloc[max(0, i - lookback):i + 1]
                
                if len(hist_data) < lookback:
                    continue
                
                # テクニカル指標を計算
                close = hist_data['Close']
                
                sma_short = close.rolling(
                    PERIOD_CONFIG[period]['sma_short']
                ).mean().iloc[-1]
                sma_long = close.rolling(
                    PERIOD_CONFIG[period]['sma_long']
                ).mean().iloc[-1]
                
                # リターンを計算
                if period == "1w":
                    lookback_ret = 5
                elif period == "1m":
                    lookback_ret = 20
                else:
                    lookback_ret = 120
                
                if len(close) > lookback_ret:
                    return_pct = (
                        (close.iloc[-1] - close.iloc[-lookback_ret - 1]) / 
                        close.iloc[-lookback_ret - 1] * 100
                    )
                    hist_returns = close.pct_change().dropna().values * 100
                else:
                    return_pct = 0
                    hist_returns = np.array([])
                
                # 出来高
                volume = price_data['Volume'].iloc[max(0, i - 20):i + 1]
                volume_ratio = (
                    price_data['Volume'].iloc[i] / volume.mean() 
                    if volume.mean() > 0 else 1
                )
                
                # 財務データ（簡略化）
                per = None
                pbr = None
                roe = None
                growth = None
                
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    per = info.get('trailingPE')
                    pbr = info.get('priceToBook')
                    roe = info.get('returnOnEquity')
                except:
                    pass
                
                # 予測実行
                result = model.predict(
                    return_data=hist_returns,
                    sma_short=float(sma_short),
                    sma_long=float(sma_long),
                    volume_ratio=volume_ratio,
                    per=per,
                    pbr=pbr,
                    roe=roe,
                    growth_rate=growth,
                    historical_pers=np.array([]),
                )
                
                probability = result['probability']
                
                # シグナル判定
                if probability >= probability_threshold:
                    signal = {
                        'date': price_data.index[i].strftime('%Y-%m-%d'),
                        'probability': probability,
                        'price': float(price_data['Close'].iloc[i]),
                        'target': int(targets[i]),
                        'recommendation': result['recommendation'],
                    }
                    signals.append(signal)
                    predictions.append({
                        'probability': probability,
                        'target': targets[i],
                    })
            
            # 統計量を計算
            if len(predictions) == 0:
                return {
                    'symbol': symbol,
                    'period': period,
                    'total_signals': 0,
                    'hit_rate': 0,
                    'average_return': 0,
                    'win_rate': 0,
                    'sharpe_ratio': 0,
                    'max_drawdown': 0,
                    'signals': [],
                }
            
            targets_array = np.array([p['target'] for p in predictions])
            hit_count = np.sum(targets_array)
            hit_rate = (hit_count / len(predictions)) * 100
            
            # 回収率の計算（簡略化）
            lookforward = 5 if period == "1w" else (20 if period == "1m" else 120)
            returns = []
            
            for i, signal in enumerate(signals):
                signal_idx = price_data.index.get_loc(
                    pd.Timestamp(signal['date'])
                )
                if signal_idx + lookforward < len(price_data):
                    future_price = price_data['Close'].iloc[signal_idx + lookforward]
                    entry_price = signal['price']
                    return_pct = (
                        (future_price - entry_price) / entry_price * 100
                    )
                    returns.append(return_pct)
            
            if len(returns) > 0:
                average_return = np.mean(returns)
                win_rate = (sum(1 for r in returns if r > 0) / len(returns)) * 100
                sharpe = np.mean(returns) / (np.std(returns) + 1e-6) * np.sqrt(252)
                
                # Max Drawdown
                cumulative = np.cumprod(1 + np.array(returns) / 100)
                running_max = np.maximum.accumulate(cumulative)
                drawdown = (cumulative - running_max) / running_max
                max_dd = np.min(drawdown) * 100 if len(drawdown) > 0 else 0
            else:
                average_return = 0
                win_rate = 0
                sharpe = 0
                max_dd = 0
            
            return {
                'symbol': symbol,
                'period': period,
                'total_signals': len(signals),
                'hit_rate': hit_rate,
                'average_return': average_return,
                'win_rate': win_rate,
                'sharpe_ratio': sharpe,
                'max_drawdown': max_dd,
                'signals': signals[:10],  # 最初の10シグナルのみ返す
            }
        
        except Exception as e:
            logger.error(f"Backtest error for {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'period': period,
                'error': str(e),
                'total_signals': 0,
            }


# yfinance のインポート
try:
    import yfinance as yf
except ImportError:
    yf = None
