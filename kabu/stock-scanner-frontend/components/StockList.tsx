// components/StockList.tsx

import React from 'react';
import { StockPredictionResult, RECOMMENDATIONS } from '@/lib/api';
import { RECOMMENDATIONS as RECOMMENDATION_CONFIG } from '@/lib/config';
import { usePredictionStore } from '@/store/prediction';

interface StockListProps {
  stocks: StockPredictionResult[];
  isLoading?: boolean;
}

export const StockList: React.FC<StockListProps> = ({ stocks, isLoading = false }) => {
  const { selectedStocks, toggleStockSelection } = usePredictionStore();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-12 shadow-lg text-center">
        <div className="inline-block animate-spin">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-600">予測実行中...</p>
      </div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 shadow-lg text-center">
        <p className="text-gray-500">結果がありません。予測を実行してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">銘柄</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">現在値</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-700">確率</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">推奨</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">PER/PBR</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, idx) => {
            const recConfig = RECOMMENDATION_CONFIG[stock.recommendation as keyof typeof RECOMMENDATION_CONFIG];
            const isSelected = selectedStocks.has(stock.symbol);

            return (
              <tr
                key={stock.symbol}
                className={`border-b transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50 cursor-pointer`}
                onClick={() => toggleStockSelection(stock.symbol)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStockSelection(stock.symbol)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{stock.symbol}</div>
                      {stock.company_name && (
                        <div className="text-sm text-gray-500">{stock.company_name}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  ¥{stock.current_price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                        style={{ width: `${stock.probability}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-lg">{stock.probability.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      recConfig?.color || 'bg-gray-500'
                    } ${recConfig?.text || 'text-white'}`}
                  >
                    {recConfig?.label || stock.recommendation}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex gap-2">
                    {stock.per !== null && <span>PER: {stock.per?.toFixed(1)}</span>}
                    {stock.pbr !== null && <span>PBR: {stock.pbr?.toFixed(2)}</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 詳細情報 */}
      {stocks.length > 0 && (
        <div className="px-4 py-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            <p>表示: {stocks.length}銘柄</p>
            <p>平均上昇確率: {(stocks.reduce((sum, s) => sum + s.probability, 0) / stocks.length).toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
};
