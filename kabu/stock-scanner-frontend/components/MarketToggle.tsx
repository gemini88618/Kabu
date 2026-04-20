// components/MarketToggle.tsx

import React from 'react';
import { MARKETS } from '@/lib/config';
import { usePredictionStore } from '@/store/prediction';

export const MarketToggle: React.FC = () => {
  const { selectedMarket, setMarket } = usePredictionStore();

  const marketKeys = Object.keys(MARKETS) as Array<'JPX' | 'NYSE'>;

  return (
    <div className="flex gap-2 mb-6">
      {marketKeys.map((key) => {
        const market = MARKETS[key];
        return (
          <button
            key={key}
            onClick={() => setMarket(key as 'JPX' | 'NYSE')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              selectedMarket === key
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 shadow hover:shadow-md'
            }`}
          >
            <div className="text-lg">{market.label}</div>
            <div className="text-xs mt-1 opacity-70">{market.description}</div>
          </button>
        );
      })}
    </div>
  );
};
