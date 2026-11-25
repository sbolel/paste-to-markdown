import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { injectHomepage } from "./prerender-html.mjs";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const entry = join(webRoot, "src/entry-server.tsx");
const config = {
  root: webRoot,
  configFile: join(webRoot, "vite.config.ts"),
  mode: "production",
};

// External SSR dependencies must select the same runtime as the browser build.
process.env.NODE_ENV = "production";
await build(config);

// Bare SSR imports resolve through the web package's dependency ancestry.
const cache = join(webRoot, "node_modules/.cache");
await mkdir(cache, { recursive: true });
const serverDir = await mkdtemp(join(cache, "homepage-render-"));
try {
  await build({
    ...config,
    publicDir: false,
    build: {
      ssr: entry,
      outDir: serverDir,
      emptyOutDir: false,
      copyPublicDir: false,
      ssrEmitAssets: false,
      emitAssets: false,
      rolldownOptions: {
        input: entry,
        output: { format: "es", entryFileNames: "entry-server.mjs" },
      },
    },
  });
  const { render } = await import(
    pathToFileURL(join(serverDir, "entry-server.mjs")).href
  );
  const markup = render();
  if (markup !== render()) {
    throw new Error("Homepage rendering must be deterministic");
  }
  const homepage = join(webRoot, "dist/index.html");
  const template = await readFile(homepage, "utf8");
  await writeFile(homepage, injectHomepage(template, markup));
  console.log("Prerendered homepage with the shared React application");
} finally {
  await rm(serverDir, { recursive: true, force: true });
}
