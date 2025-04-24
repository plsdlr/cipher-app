// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.wasm'], // Tell Vite to recognize WASM files as assets
  build: {
    assetsInlineLimit: 0, // Don't inline WASM files
  },
});
