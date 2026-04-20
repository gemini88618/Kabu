// components/PeriodSelector.tsx

import React from 'react';
import { PERIODS } from '@/lib/config';
import { usePredictionStore } from '@/store/prediction';

export const PeriodSelector: React.FC = () => {
  const { selectedPeriod, setPeriod } = usePredictionStore();

  const periodKeys = Object.keys(PERIODS) as Array<'1w' | '1m' | '6m'>;

  return (
    <div className="flex gap-2 mb-6">
      {periodKeys.map((key) => {
        const period = PERIODS[key];
        return (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              selectedPeriod === key
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 shadow hover:shadow-md'
            }`}
          >
            <div className="text-lg">{period.label}</div>
            <div className="text-xs mt-1 opacity-70">{period.description}</div>
          </button>
        );
      })}
    </div>
  );
};
