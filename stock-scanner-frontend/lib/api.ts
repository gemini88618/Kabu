// lib/api.ts

import axios from 'axios';
import { API_BASE_URL } from './config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// エラーハンドリング
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

// ========== 予測 API ==========

export interface Coefficients {
  period: '1w' | '1m' | '6m';
  w_ret?: number;
  w_sma?: number;
  w_vol?: number;
  w_per?: number;
  w_pbr?: number;
  w_roe?: number;
  w_growth?: number;
}

export interface PredictionRequest {
  symbols: string[];
  period: '1w' | '1m' | '6m';
  market: 'JPX' | 'NYSE';
  coefficients?: Coefficients;
  use_cache?: boolean;
}

export interface StockPredictionResult {
  symbol: string;
  company_name?: string;
  current_price: number;
  probability: number;
  recommendation: string;
  momentum_score: number;
  value_score: number;
  composite_score: number;
  target_return: number;
  per?: number;
  pbr?: number;
  roe?: number;
  revenue_growth?: number;
  sma_5?: number;
  sma_20?: number;
  return_1w?: number;
  volume_ratio?: number;
  timestamp: string;
}

export interface PredictionResponse {
  period: string;
  target_return: number;
  market: string;
  timestamp: string;
  total_stocks_analyzed: number;
  top_stocks: StockPredictionResult[];
  summary: Record<string, any>;
}

export async function predictStockPrices(
  request: PredictionRequest
): Promise<PredictionResponse> {
  const response = await api.post<PredictionResponse>(
    '/predict',
    request
  );
  return response.data;
}

// ========== バックテスト API ==========

export interface BacktestRequest {
  symbols: string[];
  period: '1w' | '1m' | '6m';
  market: 'JPX' | 'NYSE';
  start_date: string;
  end_date: string;
  probability_threshold?: number;
}

export interface BacktestResult {
  symbol: string;
  period: string;
  total_signals: number;
  hit_rate: number;
  average_return: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  signals: Record<string, any>[];
}

export interface BacktestResponse {
  period: string;
  market: string;
  start_date: string;
  end_date: string;
  timestamp: string;
  results: BacktestResult[];
  summary: Record<string, any>;
}

export async function runBacktest(
  request: BacktestRequest
): Promise<BacktestResponse> {
  const response = await api.post<BacktestResponse>(
    '/backtest',
    request
  );
  return response.data;
}

// ========== 銘柄リスト API ==========

export async function getStockList(market: 'JPX' | 'NYSE'): Promise<string[]> {
  const response = await api.get<{ stocks: string[] }>(
    `/stocks/${market}`
  );
  return response.data.stocks;
}

// ========== ヘルスチェック ==========

export async function healthCheck(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}
