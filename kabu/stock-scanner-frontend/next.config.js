/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // API プロキシ設定（開発時）
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: process.env.BACKEND_URL 
            ? `${process.env.BACKEND_URL}/api/:path*`
            : 'http://localhost:8000/api/:path*',
        },
      ],
    };
  },
  
  // 環境変数
  env: {
    NEXT_PUBLIC_API_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  },
  
  // PWA 設定を適用
  ...withPWA({}),
};

module.exports = nextConfig;
