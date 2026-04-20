// components/CoefficientSliders.tsx

import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { usePredictionStore } from '@/store/prediction';

const COEFFICIENT_LABELS: Record<string, string> = {
  w_ret: '直近リターン',
  w_sma: 'SMA クロス',
  w_vol: '出来高比',
  w_per: 'PER (バリュエーション)',
  w_pbr: 'PBR (ブック比)',
  w_roe: 'ROE (効率性)',
  w_growth: '収益成長',
};

export const CoefficientSliders: React.FC = () => {
  const { coefficients, updateCoefficient } = usePredictionStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const momentumKeys = ['w_ret', 'w_sma', 'w_vol'];
  const valueKeys = ['w_per', 'w_pbr', 'w_roe', 'w_growth'];

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">アルゴリズム係数</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          {showAdvanced ? '基本に戻す' : '詳細設定'}
        </button>
      </div>

      {/* モメンタム係数 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">モメンタム指標</h3>
        <div className="space-y-4">
          {momentumKeys.map((key) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {COEFFICIENT_LABELS[key]}
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {(coefficients[key] * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={coefficients[key]}
                onChange={(value) => updateCoefficient(key, value as number)}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* バリュー係数（詳細設定時のみ） */}
      {showAdvanced && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-4">バリュー指標</h3>
          <div className="space-y-4">
            {valueKeys.map((key) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {COEFFICIENT_LABELS[key]}
                  </label>
                  <span className="text-sm font-bold text-green-600">
                    {(coefficients[key] * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={coefficients[key]}
                  onChange={(value) => updateCoefficient(key, value as number)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 係数の合計表示 */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <div className="flex justify-between">
          <span>合計重み:</span>
          <span className={
            Object.values(coefficients).reduce((a, b) => a + b, 0) > 1.01
              ? 'text-red-600 font-bold'
              : 'text-gray-700'
          }>
            {(Object.values(coefficients).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
