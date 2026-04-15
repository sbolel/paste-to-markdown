import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const contentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'";

export default defineConfig(({ command }) => ({
  base: "/paste-to-markdown/",
  plugins:
    command === "build"
      ? [
          {
            name: "inject-content-security-policy",
            transformIndexHtml(html) {
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
      : [],
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
      input: "index.html",
    },
  },
}));
