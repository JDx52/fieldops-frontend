import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './FieldOpsApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => console.log('Service worker registered:', reg.scope))
      .catch(err => console.log('Service worker failed:', err));
  });
}
