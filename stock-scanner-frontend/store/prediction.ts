// store/prediction.ts

import { create } from 'zustand';
import { StockPredictionResult } from '@/lib/api';

export interface PredictionStore {
  // State
  selectedPeriod: '1w' | '1m' | '6m';
  selectedMarket: 'JPX' | 'NYSE';
  coefficients: Record<string, number>;
  results: StockPredictionResult[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  selectedStocks: Set<string>;

  // Actions
  setPeriod: (period: '1w' | '1m' | '6m') => void;
  setMarket: (market: 'JPX' | 'NYSE') => void;
  setCoefficients: (coefficients: Record<string, number>) => void;
  updateCoefficient: (key: string, value: number) => void;
  setResults: (results: StockPredictionResult[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleStockSelection: (symbol: string) => void;
  clearSelection: () => void;
  reset: () => void;
}

const DEFAULT_PERIOD = '1w' as const;
const DEFAULT_MARKET = 'JPX' as const;

const DEFAULT_COEFFICIENTS = {
  w_ret: 0.5,
  w_sma: 0.3,
  w_vol: 0.2,
  w_per: 0.20,
  w_pbr: 0.15,
  w_roe: 0.30,
  w_growth: 0.35,
};

export const usePredictionStore = create<PredictionStore>((set) => ({
  // 初期状態
  selectedPeriod: DEFAULT_PERIOD,
  selectedMarket: DEFAULT_MARKET,
  coefficients: DEFAULT_COEFFICIENTS,
  results: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedStocks: new Set(),

  // Period の設定
  setPeriod: (period) =>
    set(() => ({
      selectedPeriod: period,
      results: [], // リセット
      error: null,
    })),

  // Market の設定
  setMarket: (market) =>
    set(() => ({
      selectedMarket: market,
      results: [],
      error: null,
    })),

  // 係数セットの設定
  setCoefficients: (coefficients) =>
    set(() => ({
      coefficients,
    })),

  // 個別係数の更新
  updateCoefficient: (key, value) =>
    set((state) => ({
      coefficients: {
        ...state.coefficients,
        [key]: Math.max(0, Math.min(1, value)), // 0-1 にクランプ
      },
    })),

  // 予測結果の設定
  setResults: (results) =>
    set(() => ({
      results,
      lastUpdated: new Date(),
      error: null,
    })),

  // ローディング状態
  setLoading: (isLoading) =>
    set(() => ({
      isLoading,
    })),

  // エラー設定
  setError: (error) =>
    set(() => ({
      error,
      isLoading: false,
    })),

  // 銘柄の選択状態を切り替え
  toggleStockSelection: (symbol) =>
    set((state) => {
      const newSelection = new Set(state.selectedStocks);
      if (newSelection.has(symbol)) {
        newSelection.delete(symbol);
      } else {
        newSelection.add(symbol);
      }
      return { selectedStocks: newSelection };
    }),

  // 選択をクリア
  clearSelection: () =>
    set(() => ({
      selectedStocks: new Set(),
    })),

  // 全リセット
  reset: () =>
    set(() => ({
      selectedPeriod: DEFAULT_PERIOD,
      selectedMarket: DEFAULT_MARKET,
      coefficients: DEFAULT_COEFFICIENTS,
      results: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
      selectedStocks: new Set(),
    })),
}));

// ブラウザストレージへの永続化（オプション）
if (typeof window !== 'undefined') {
  const store = usePredictionStore;

  // ページロード時に復元
  const savedState = localStorage.getItem('prediction-store');
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      store.setState({
        selectedPeriod: parsed.selectedPeriod || DEFAULT_PERIOD,
        selectedMarket: parsed.selectedMarket || DEFAULT_MARKET,
        coefficients: parsed.coefficients || DEFAULT_COEFFICIENTS,
      });
    } catch (e) {
      console.warn('Failed to restore store:', e);
    }
  }

  // 状態変更時に保存
  store.subscribe((state) => {
    localStorage.setItem(
      'prediction-store',
      JSON.stringify({
        selectedPeriod: state.selectedPeriod,
        selectedMarket: state.selectedMarket,
        coefficients: state.coefficients,
      })
    );
  });
}
