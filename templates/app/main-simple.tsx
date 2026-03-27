import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SdkProvider } from './lib/sdk-context';
import { App } from './views/App';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <SdkProvider>
      <App />
    </SdkProvider>
  </StrictMode>
);
