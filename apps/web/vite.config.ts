import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const contentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'";

const siteBase = "/paste-to-markdown/";
const workspaceRoot = new URL("../../", import.meta.url);

export default defineConfig(({ command, isSsrBuild }) => ({
  base: siteBase,
  publicDir: fileURLToPath(new URL("public", workspaceRoot)),
  plugins: [
    react(),
    ...(!isSsrBuild ? [tailwindcss()] : []),
    ...(command === "build" && !isSsrBuild
      ? [
          {
            name: "keep-server-rendering-out-of-browser",
            generateBundle(_options, bundle) {
              for (const output of Object.values(bundle)) {
                if (output.type !== "chunk") continue;
                if (
                  output.moduleIds.some(
                    (id) =>
                      id.endsWith("/src/entry-server.tsx") ||
                      /react-dom\/(?:cjs\/)?(?:react-dom-)?(?:server|static)[./-]/.test(
                        id,
                      ),
                  )
                ) {
                  this.error(
                    "Server rendering modules entered the browser bundle",
                  );
                }
              }
            },
          } satisfies Plugin,
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
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@paste-to-markdown/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    // Keep even small font subsets on-origin under the production CSP.
    assetsInlineLimit: 0,
    outDir: "dist",
    rolldownOptions: isSsrBuild
      ? {}
      : { input: { main: "index.html", about: "about/index.html" } },
  },
}));
