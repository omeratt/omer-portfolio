import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/sora/index.css';
import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/type.css';

import { ThemeProvider } from './theme/ThemeProvider';
import { MotionProvider } from './motion/MotionProvider';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <App />
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>,
);
