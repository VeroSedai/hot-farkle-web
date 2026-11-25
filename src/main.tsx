import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n/I18nContext';
import './index.css';

const ALLOWED_HOST_SUFFIXES = [
  'verosedai.github.io',
  'itch.zone',
  'itch.io',
  'hwcdn.net',
  'localhost',
  '127.0.0.1',
];

function isAuthorizedHost(): boolean {
  const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  if (isDev || typeof window === 'undefined') return true;
  const host = window.location.hostname.toLowerCase();
  if (!host) return true;
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

const rootEl = document.getElementById('root')!;

if (!isAuthorizedHost()) {
  rootEl.innerHTML =
    '<div style="display:grid;place-items:center;height:100vh;font-family:system-ui,sans-serif;text-align:center;padding:24px;background:#1e4d3e;color:#fffdf5;"><div><h1 style="margin:0 0 8px;color:#ffbe0b;">HOT FARKLE</h1><p style="margin:0;">Official version available on <strong>verosedai.github.io</strong> and <strong>itch.io</strong>.</p></div></div>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StrictMode>
  );
}
