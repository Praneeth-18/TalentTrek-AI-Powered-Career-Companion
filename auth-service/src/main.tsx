import React from 'react';
import { createRoot } from 'react-dom/client';
import './lib/aws-config';  // Import AWS config first
import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
