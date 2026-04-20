import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // スプラッシュスクリーン表示（1秒）
    const timer = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // PWA インストール対応
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
        });
    }

    // iOS PWA 対応
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // Apple メタタグの設定
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no'
        );
      }

      // ステータスバーの透過設定
      const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBar) {
        statusBar.setAttribute('content', 'black-translucent');
      }

      // ホーム画面キャッシュを有効化
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          console.log('iOS PWA ready');
        });
      }

      // iPhone X+ ノッチ対応
      document.documentElement.style.setProperty(
        '--safe-area-inset-top',
        'max(12px, env(safe-area-inset-top))'
      );
      document.documentElement.style.setProperty(
        '--safe-area-inset-bottom',
        'max(12px, env(safe-area-inset-bottom))'
      );
    }

    // インストール促進プロンプト
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      // UI にインストールボタンを表示
      const installBtn = document.getElementById('install-btn');
      if (installBtn) {
        installBtn.style.display = 'block';
      }
    });

    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          deferredPrompt = null;
        }
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('PWA app installed');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    });
  }, []);

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
        />
        <meta name="description" content="AI駆動の株価上昇確率予測システム" />
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stocks" />
        <meta name="apple-itunes-app" content="app-id=" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="email=no" />
        
        {/* iPhone スプラッシュスクリーン */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />

        {/* Apple タッチアイコン */}
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-180-apple.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152-apple.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167-apple.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180-apple.png" />

        {/* PWA マニフェスト */}
        <link rel="manifest" href="/manifest.json" />

        {/* アイコン */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />

        {/* フォント */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* スプラッシュスクリーン */}
      {showSplash && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center z-50 safe-top safe-bottom">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl">📈</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Stock Scanner</h1>
            <p className="text-blue-100">Loading...</p>
            <div className="mt-6 w-32 h-1 bg-blue-400 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-white animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        <Component {...pageProps} />
      </div>

      {/* インストールボタン（スタイルは各ページで） */}
      <button
        id="install-btn"
        style={{ display: 'none' }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg safe-bottom"
      >
        アプリをインストール
      </button>
    </>
  );
}

export default MyApp;
