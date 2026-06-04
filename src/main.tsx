import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// VP-17: Bootstrap i18n before any component renders
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
