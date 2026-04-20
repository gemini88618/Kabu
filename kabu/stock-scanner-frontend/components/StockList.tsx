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
      <div className="bg-white rounded-lg p-8 md:p-12 shadow-lg text-center mx-4 md:mx-0">
        <div className="inline-block animate-spin">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-600 text-sm md:text-base">予測実行中...</p>
      </div>
    );
  }

  if (!stocks || stocks.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 md:p-12 shadow-lg text-center mx-4 md:mx-0">
        <p className="text-gray-500 text-sm md:text-base">結果がありません。予測を実行してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mx-4 md:mx-0 scroll-container">
      <div className="overflow-x-auto -webkit-overflow-scrolling: touch;">
        <table className="w-full text-sm md:text-base">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="px-2 md:px-4 py-2 md:py-3 text-left font-semibold text-xs md:text-base text-gray-700 no-select">銘柄</th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-right font-semibold text-xs md:text-base text-gray-700 no-select">現在値</th>
            <th className="px-2 md:px-4 py-2 md:py-3 text-right font-semibold text-xs md:text-base text-gray-700 no-select">確率</th>
            <th className="hidden md:table-cell px-4 py-3 text-left font-semibold text-gray-700">推奨</th>
            <th className="hidden lg:table-cell px-4 py-3 text-left font-semibold text-gray-700">PER/PBR</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, idx) => {
            const recConfig = RECOMMENDATION_CONFIG[stock.recommendation as keyof typeof RECOMMENDATION_CONFIG];
            const isSelected = selectedStocks.has(stock.symbol);

            return (
              <tr
                key={stock.symbol}
                className={`border-b transition-colors active:bg-blue-100 touch-manipulation cursor-pointer ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50`}
                onClick={() => toggleStockSelection(stock.symbol)}
              >
                <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStockSelection(stock.symbol)}
                      className="w-4 h-4 cursor-pointer touch-manipulation"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 text-xs md:text-sm">{stock.symbol}</div>
                      {stock.company_name && (
                        <div className="text-xs text-gray-500 hidden md:block">{stock.company_name}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 text-right font-semibold text-xs md:text-sm">
                  ¥{stock.current_price.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 text-right">
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <div className="w-12 md:w-16 bg-gray-200 rounded-full h-1 md:h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1 md:h-2 rounded-full"
                        style={{ width: `${stock.probability}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-xs md:text-lg">{stock.probability.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 py-3">
                  <span
                    className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                      recConfig?.color || 'bg-gray-500'
                    } ${recConfig?.text || 'text-white'}`}
                  >
                    {recConfig?.label || stock.recommendation}
                  </span>
                </td>
                <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
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
      </div>

      {/* 詳細情報 */}
      {stocks.length > 0 && (
        <div className="px-3 md:px-4 py-3 md:py-4 bg-gray-50 border-t text-xs md:text-sm text-gray-600 no-select">
          <p>表示: {stocks.length}銘柄</p>
          <p>平均上昇確率: {(stocks.reduce((sum, s) => sum + s.probability, 0) / stocks.length).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};
