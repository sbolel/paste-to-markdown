import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type Plugin } from "vite";

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;
const sitemapBaseUrl = 'https://sbolel.github.io/paste-to-markdown/';
const sitemapRoutes = ['', 'about/'];

const getBuildDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const sitemapPlugin = (): Plugin => {
  let outDir = resolve(projectRoot, 'dist');

  return {
    name: 'generate-sitemap',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const lastmod = getBuildDate();
      const urls = sitemapRoutes
        .map((route) => {
          const loc = new URL(route, sitemapBaseUrl).toString();

          return [
            '  <url>',
            `    <loc>${loc}</loc>`,
            `    <lastmod>${lastmod}</lastmod>`,
            '  </url>',
          ].join('\n');
        })
        .join('\n');
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        '</urlset>',
        '',
      ].join('\n');

      await writeFile(resolve(outDir, 'sitemap.xml'), sitemap, 'utf8');
    },
  };
};

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
    sitemapPlugin(),
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
