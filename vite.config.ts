import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // dev serves from '/'; the production build targets the GitHub Pages
  // project subpath https://omeratt.github.io/omer-portfolio/
  base: command === 'build' ? '/omer-portfolio/' : '/',
  plugins: [react()],
  build: {
    // three.js ships as one lazy-loaded chunk (HeroCanvas) by design —
    // it never blocks first paint, so the default size warning is noise here
    chunkSizeWarningLimit: 950,
  },
}));
