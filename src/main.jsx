import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Configurar XLSX para não usar web worker
if (typeof window !== 'undefined' && window.XLSX) {
  window.XLSX.set_fs(null);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
