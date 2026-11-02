import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Root domain deployment (royal-team.nl) -> assets are served from '/'
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Multi-page: elke pagina krijgt een eigen map in dist/ (o.a. /retail/ en /forever/)
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        retail: resolve(import.meta.dirname, 'retail/index.html'),
        forever: resolve(import.meta.dirname, 'forever/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
