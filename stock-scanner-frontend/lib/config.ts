// lib/config.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const PERIODS = {
  '1w': {
    label: '1週間',
    target_return: 10,
    description: '10%以上の上昇確率',
    periods: [
      'past-3w-2w',
      'past-2w-1w',
      'past-1w-now',
      'now-1w-future',
    ],
  },
  '1m': {
    label: '1ヶ月',
    target_return: 15,
    description: '15%以上の上昇確率',
    periods: [
      'past-3m-2m',
      'past-2m-1m',
      'past-1m-now',
      'now-1m-future',
    ],
  },
  '6m': {
    label: '半年',
    target_return: 30,
    description: '30%以上の上昇確率',
    periods: [
      'past-1y-6m',
      'past-6m-now',
      'now-6m-future',
    ],
  },
};

export const MARKETS = {
  JPX: {
    label: '日本株',
    description: 'Tokyo Stock Exchange',
  },
  NYSE: {
    label: '米国株',
    description: 'New York Stock Exchange',
  },
};

export const DEFAULT_COEFFICIENTS = {
  '1w': {
    w_ret: 0.5,
    w_sma: 0.3,
    w_vol: 0.2,
    w_per: 0.20,
    w_pbr: 0.15,
    w_roe: 0.30,
    w_growth: 0.35,
  },
  '1m': {
    w_ret: 0.5,
    w_sma: 0.3,
    w_vol: 0.2,
    w_per: 0.35,
    w_pbr: 0.20,
    w_roe: 0.25,
    w_growth: 0.20,
  },
  '6m': {
    w_ret: 0.5,
    w_sma: 0.3,
    w_vol: 0.2,
    w_per: 0.30,
    w_pbr: 0.25,
    w_roe: 0.25,
    w_growth: 0.20,
  },
};

export const RECOMMENDATIONS = {
  'Strong Buy': {
    color: 'bg-green-600',
    text: 'text-white',
    label: '強気買い',
  },
  'Buy': {
    color: 'bg-green-500',
    text: 'text-white',
    label: '買い',
  },
  'Hold': {
    color: 'bg-yellow-500',
    text: 'text-white',
    label: '保持',
  },
  'Sell': {
    color: 'bg-orange-500',
    text: 'text-white',
    label: '売り',
  },
  'Strong Sell': {
    color: 'bg-red-600',
    text: 'text-white',
    label: '強気売り',
  },
};
