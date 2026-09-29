import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

import App from './App';
import { LanguageProvider } from './i18n/LanguageProvider';
import './styles/tokens.css';
import './styles/deepseek.css';
import './styles/guided.css';
// autoUpdate: the SW swaps in a new build on the next navigation rather than
// trapping people on a stale cached shell.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (window.confirm('A new version of Sahayak Seva is available. Reload now?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // Offline readiness is a selling point, but it must not interrupt someone
    // mid-sentence, so it is logged rather than announced with a dialog.
    console.info('[Sahayak Seva] Ready to work offline.');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
