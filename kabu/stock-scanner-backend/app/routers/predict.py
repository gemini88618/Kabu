from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.models import (
    PredictionRequest, PredictionResponse, StockPredictionResult,
    BacktestRequest, BacktestResponse, BacktestResult,
    CoefficientInput, HealthResponse
)
from app.services.data_fetcher import DataFetcher, fetch_stock_data_parallel
from app.services.prediction import MultiPeriodStockPrediction, PERIOD_CONFIG
from app.services.backtest import BacktestEngine
from config import get_settings

router = APIRouter(prefix="/api", tags=["stock-prediction"])
logger = logging.getLogger(__name__)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """ヘルスチェック"""
    return HealthResponse(
        status="OK",
        api_version="1.0.0",
        timestamp=datetime.now(),
        environment="production" if get_settings().BACKEND_URL.startswith("https") else "development"
    )


@router.post("/predict", response_model=PredictionResponse)
async def predict_stock_prices(request: PredictionRequest):
    """
    株価上昇確率を予測
    
    Args:
        request: 予測リクエスト
    
    Returns:
        予測結果
    """
    try:
        settings = get_settings()
        
        # 係数の検証
        if request.coefficients:
            request.coefficients.validate_weights()
            coeff_dict = request.coefficients.dict(exclude={'period'})
        else:
            coeff_dict = settings.DEFAULT_COEFFICIENTS[request.period]
        
        # データ取得
        data_results = await fetch_stock_data_parallel(
            request.symbols,
            period="1y"
        )
        
        # 予測を実行
        predictions_list = []
        
        for symbol in request.symbols:
            try:
                price_df, financial_data = data_results.get(symbol, (None, None))
                
                if price_df is None or financial_data is None:
                    logger.warning(f"No data for {symbol}")
                    continue
                
                # テクニカル指標を計算
                tech_indicators = DataFetcher.calculate_technical_indicators(
                    price_df,
                    lookback=PERIOD_CONFIG[request.period]['lookback_days']
                )
                
                # 過去データを取得
                hist_returns = DataFetcher.get_historical_returns(
                    price_df,
                    lookback=PERIOD_CONFIG[request.period]['lookback_days']
                )
                hist_pers = DataFetcher.get_historical_pers(
                    price_df,
                    symbol,
                    lookback=PERIOD_CONFIG[request.period]['lookback_days']
                )
                
                # 予測実行
                model = MultiPeriodStockPrediction(request.period, coeff_dict)
                result = model.predict(
                    return_data=hist_returns,
                    sma_short=tech_indicators.get('sma_5', 0),
                    sma_long=tech_indicators.get('sma_20', 0),
                    volume_ratio=tech_indicators.get('volume_ratio', 1),
                    per=financial_data.get('per'),
                    pbr=financial_data.get('pbr'),
                    roe=financial_data.get('roe'),
                    growth_rate=financial_data.get('revenue_growth'),
                    historical_pers=hist_pers,
                )
                
                # 結果を構築
                prediction = StockPredictionResult(
                    symbol=symbol,
                    company_name=financial_data.get('company_name'),
                    current_price=financial_data.get('current_price', 0),
                    probability=result['probability'],
                    recommendation=result['recommendation'],
                    momentum_score=result['momentum_score'],
                    value_score=result['value_score'],
                    composite_score=result['composite_score'],
                    target_return=result['target_return'],
                    per=financial_data.get('per'),
                    pbr=financial_data.get('pbr'),
                    roe=financial_data.get('roe'),
                    revenue_growth=financial_data.get('revenue_growth'),
                    sma_5=tech_indicators.get('sma_5'),
                    sma_20=tech_indicators.get('sma_20'),
                    return_1w=tech_indicators.get('return_1w'),
                    volume_ratio=tech_indicators.get('volume_ratio'),
                    timestamp=datetime.now(),
                )
                
                predictions_list.append(prediction)
            
            except Exception as e:
                logger.error(f"Error predicting {symbol}: {str(e)}")
                continue
        
        # 上昇確率でソート
        predictions_list.sort(key=lambda x: x.probability, reverse=True)
        top_stocks = predictions_list[:10]
        
        # 集計統計
        if len(predictions_list) > 0:
            probs = [p.probability for p in predictions_list]
            summary = {
                'total_stocks': len(predictions_list),
                'average_probability': sum(probs) / len(probs),
                'recommendation_distribution': {
                    'Strong Buy': sum(1 for p in predictions_list if p.recommendation == 'Strong Buy'),
                    'Buy': sum(1 for p in predictions_list if p.recommendation == 'Buy'),
                    'Hold': sum(1 for p in predictions_list if p.recommendation == 'Hold'),
                    'Sell': sum(1 for p in predictions_list if p.recommendation == 'Sell'),
                    'Strong Sell': sum(1 for p in predictions_list if p.recommendation == 'Strong Sell'),
                },
            }
        else:
            summary = {'total_stocks': 0, 'error': 'No data available'}
        
        return PredictionResponse(
            period=request.period,
            target_return=PERIOD_CONFIG[request.period]['target_return'],
            market=request.market,
            timestamp=datetime.now(),
            total_stocks_analyzed=len(data_results),
            top_stocks=top_stocks,
            summary=summary,
        )
    
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """
    バックテストを実行
    
    Args:
        request: バックテストリクエスト
    
    Returns:
        バックテスト結果
    """
    try:
        results = []
        
        for symbol in request.symbols:
            result_dict = BacktestEngine.backtest_single_stock(
                symbol=symbol,
                period=request.period,
                start_date=request.start_date,
                end_date=request.end_date,
                probability_threshold=request.probability_threshold,
            )
            
            if 'error' not in result_dict:
                result = BacktestResult(**result_dict)
                results.append(result)
        
        # 集計統計
        if len(results) > 0:
            summary = {
                'total_symbols': len(results),
                'average_hit_rate': sum(r.hit_rate for r in results) / len(results),
                'average_sharpe_ratio': sum(r.sharpe_ratio for r in results) / len(results),
                'total_signals': sum(r.total_signals for r in results),
            }
        else:
            summary = {'error': 'No results'}
        
        return BacktestResponse(
            period=request.period,
            market=request.market,
            start_date=request.start_date,
            end_date=request.end_date,
            timestamp=datetime.now(),
            results=results,
            summary=summary,
        )
    
    except Exception as e:
        logger.error(f"Backtest error: {str(e)}")
        raise HTTPException(status_code=500, detail="Backtest failed")


@router.get("/stocks/{market}")
async def get_stock_list(market: str = Query(..., description="Market (JPX or NYSE)")):
    """
    市場別の銘柄リストを取得
    """
    try:
        stocks = DataFetcher.get_stock_list(market)
        return {
            'market': market,
            'stocks': stocks,
            'count': len(stocks),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
