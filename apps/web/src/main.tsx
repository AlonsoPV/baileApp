import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './components/Toast';
import App from './App';
import './index.css';
// ✅ Inicializar i18n ANTES de renderizar la app
import './i18n';
import { installNativeAuthBridge } from "./native/nativeAuthBridge";

// Normalizar URLs con dobles barras ANTES de que React Router las procese
if (window.location.pathname.includes('//')) {
  const normalizedPath = window.location.pathname.replace(/\/+/g, '/');
  const normalizedUrl = normalizedPath + window.location.search + window.location.hash;
  window.history.replaceState({}, '', normalizedUrl);
}

// ✅ Install WebView <-> Native auth bridge (no browser OAuth)
installNativeAuthBridge();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
      {/* React Query Devtools - Solo en desarrollo - Debe estar dentro de QueryClientProvider */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
