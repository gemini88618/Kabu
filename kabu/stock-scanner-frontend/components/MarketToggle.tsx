// components/MarketToggle.tsx

import React from 'react';
import { MARKETS } from '@/lib/config';
import { usePredictionStore } from '@/store/prediction';

export const MarketToggle: React.FC = () => {
  const { selectedMarket, setMarket } = usePredictionStore();

  const marketKeys = Object.keys(MARKETS) as Array<'JPX' | 'NYSE'>;

  return (
    <div className="flex gap-2 mb-6 flex-wrap md:flex-nowrap">
      {marketKeys.map((key) => {
        const market = MARKETS[key];
        return (
          <button
            key={key}
            onClick={() => setMarket(key as 'JPX' | 'NYSE')}
            className={`flex-1 min-h-[48px] px-3 md:px-4 py-3 md:py-3 rounded-lg font-semibold transition-all active:scale-95 touch-manipulation text-xs md:text-sm ${
              selectedMarket === key
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 shadow hover:shadow-md'
            }`}
          >
            <div className="text-base md:text-lg font-bold">{market.label}</div>
            <div className="text-xs mt-1 opacity-70">{market.description}</div>
          </button>
        );
      })}
    </div>
  );
};
