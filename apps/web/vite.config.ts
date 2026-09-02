import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const contentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'";

const siteBase = "/paste-to-markdown/";
const workspaceRoot = new URL("../../", import.meta.url);

export default defineConfig(({ command }) => ({
  base: siteBase,
  publicDir: fileURLToPath(new URL("public", workspaceRoot)),
  plugins: [
    ...(command === "build"
      ? [
          {
            name: "inject-content-security-policy",
            transformIndexHtml(html: string) {
              return {
                html,
                tags: [
                  {
                    tag: "meta",
                    injectTo: "head",
                    attrs: {
                      "http-equiv": "Content-Security-Policy",
                      content: contentSecurityPolicy,
                    },
                  },
                ],
              };
            },
          },
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@paste-to-markdown/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        about: "about/index.html",
      },
    },
  },
}));
