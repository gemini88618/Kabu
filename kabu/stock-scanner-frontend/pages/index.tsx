// pages/index.tsx

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { PeriodSelector } from '@/components/PeriodSelector';
import { MarketToggle } from '@/components/MarketToggle';
import { CoefficientSliders } from '@/components/CoefficientSliders';
import { StockList } from '@/components/StockList';
import { usePredictionStore } from '@/store/prediction';
import { predictStockPrices, StockPredictionResult } from '@/lib/api';
import { PERIODS } from '@/lib/config';

export default function Home() {
  const {
    selectedPeriod,
    selectedMarket,
    coefficients,
    results,
    isLoading,
    error,
    setLoading,
    setResults,
    setError,
  } = usePredictionStore();

  const [stocks, setStocks] = useState<string[]>([]);

  // 銘柄リストの取得
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        // Note: 実装は簡略化。実際には API から銘柄リストを取得
        const defaultStocks = selectedMarket === 'JPX'
          ? ['7203.T', '6861.T', '9984.T', '9433.T', '4503.T']
          : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
        setStocks(defaultStocks);
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
      }
    };

    fetchStocks();
  }, [selectedMarket]);

  // 予測実行
  const handlePredict = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await predictStockPrices({
        symbols: stocks,
        period: selectedPeriod,
        market: selectedMarket,
        coefficients: {
          period: selectedPeriod,
          ...coefficients,
        },
      });

      setResults(response.top_stocks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '予測に失敗しました';
      setError(errorMessage);
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const period = PERIODS[selectedPeriod];

  return (
    <>
      <Head>
        <title>Stock Scanner - 株価予測システム</title>
        <meta name="description" content="AI 駆動の株価上昇確率予測システム" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 safe-top safe-bottom">
        {/* ヘッダー */}
        <header className="mb-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📈 Stock Scanner</h1>
            <p className="text-gray-700">AI 駆動の多期間株価上昇確率予測システム</p>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-6xl mx-auto">
          {/* Period & Market Selection */}
          <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4">スキャン設定</h2>
            <PeriodSelector />
            <MarketToggle />
          </div>

          {/* 係数スライダー */}
          <CoefficientSliders />

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
              <strong>エラー:</strong> {error}
            </div>
          )}

          {/* 予測ボタン */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className={`flex-1 py-4 px-6 rounded-lg font-bold text-white text-lg transition-all ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg active:scale-95'
              }`}
            >
              {isLoading ? '🔄 予測実行中...' : '🚀 予測実行'}
            </button>
            {results.length > 0 && (
              <button
                onClick={() => setResults([])}
                className="px-6 py-4 rounded-lg font-bold text-gray-700 bg-white hover:shadow-lg transition-all"
              >
                クリア
              </button>
            )}
          </div>

          {/* 予測結果情報 */}
          {results.length > 0 && (
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg mb-6">
              <p className="text-indigo-900">
                <strong>{period.label}内に{period.target_return}%以上上昇する確率を予測しています。</strong>
              </p>
              <p className="text-indigo-700 text-sm mt-2">
                最終更新: {new Date().toLocaleTimeString('ja-JP')}
              </p>
            </div>
          )}

          {/* 結果テーブル */}
          <StockList stocks={results} isLoading={isLoading} />

          {/* 統計情報 */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">分析銘柄数</div>
                <div className="text-3xl font-bold text-blue-600">{stocks.length}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">平均確率</div>
                <div className="text-3xl font-bold text-green-600">
                  {(results.reduce((sum, s) => sum + s.probability, 0) / results.length).toFixed(1)}%
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">買い推奨</div>
                <div className="text-3xl font-bold text-indigo-600">
                  {results.filter((s) => s.recommendation === 'Buy' || s.recommendation === 'Strong Buy').length}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600">期間</div>
                <div className="text-2xl font-bold text-purple-600">{period.label}</div>
              </div>
            </div>
          )}
        </main>

        {/* フッター */}
        <footer className="mt-16 text-center text-gray-600 text-sm">
          <p>Stock Scanner v1.0 | AI 駆動の株価予測システム</p>
          <p className="mt-2">投資判断の補助システムです。投資は自己責任でお願いします。</p>
        </footer>
      </div>
    </>
  );
}
