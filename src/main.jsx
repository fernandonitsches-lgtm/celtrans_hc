import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Polyfill para evitar erro de clearMarks
if (!performance.clearMarks) {
  performance.clearMarks = () => {};
}
if (!performance.clearMeasures) {
  performance.clearMeasures = () => {};
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
