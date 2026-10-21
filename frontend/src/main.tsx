import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted font: no request to Google Fonts (would send visitors' IP to Google without consent)
import '@fontsource-variable/instrument-sans';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
