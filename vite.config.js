import { defineConfig } from 'vite';

export default defineConfig({
  // Root domain deployment (royal-team.nl) -> assets are served from '/'
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
