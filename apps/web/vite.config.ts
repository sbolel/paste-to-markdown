import { defineConfig } from 'vite';

export default defineConfig({
  base: '/paste-to-markdown/',
  resolve: {
    alias: {
      '@paste-to-markdown/core': new URL('../../packages/core/src/index.ts', import.meta.url)
        .pathname,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
