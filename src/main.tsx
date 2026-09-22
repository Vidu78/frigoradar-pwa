import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/config';
import { registerSW } from 'virtual:pwa-register';

// Senza questa riga il service worker veniva costruito e servito su /sw.js ma
// non lo registrava nessuno: niente notifiche push (navigator.serviceWorker.ready
// non si risolveva mai e l'interruttore restava appeso), niente offline, niente
// aggiornamenti. immediate: true registra subito, senza aspettare il load.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
