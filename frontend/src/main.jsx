import { Buffer } from 'buffer';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
