import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  base: '/paste-to-markdown/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        about: resolve(projectRoot, 'about/index.html'),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  optimizeDeps: {
    include: ['turndown', 'turndown-plugin-gfm']
  },
});
