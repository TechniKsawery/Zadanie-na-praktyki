import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (err: any) {
  // Jeśli renderowanie spowoduje wyjątek, pokażemy go w DOM (ułatwia debugowanie w środowisku deweloperskim)
  // eslint-disable-next-line no-console
  console.error('Błąd renderowania App:', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding:20px;background:#fff6f6;color:#900;border-radius:8px;"><h3>Błąd aplikacji</h3><pre>${String(err && err.stack ? err.stack : err)}</pre></div>`;
  }
}

// Globalny handler błędów runtime — również pokaże informację w DOM
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error || event.message);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding:20px;background:#fff6f6;color:#900;border-radius:8px;"><h3>Błąd runtime</h3><pre>${String(event.error || event.message)}</pre></div>`;
  }
});
