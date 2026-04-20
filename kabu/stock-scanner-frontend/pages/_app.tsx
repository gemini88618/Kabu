import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
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
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-capable';
      meta.content = 'yes';
      document.head.appendChild(meta);

      const statusBar = document.createElement('meta');
      statusBar.name = 'apple-mobile-web-app-status-bar-style';
      statusBar.content = 'black-translucent';
      document.head.appendChild(statusBar);
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Stock Price Prediction Scanner" />
        <meta name="theme-color" content="#1f2937" />

        {/* iOS PWA 設定 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stock Scanner" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

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

      <Component {...pageProps} />

      {/* インストールボタン（スタイルは各ページで） */}
      <button
        id="install-btn"
        style={{ display: 'none' }}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        アプリをインストール
      </button>
    </>
  );
}

export default MyApp;
