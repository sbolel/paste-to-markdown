import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

const sitePrefix = "/paste-to-markdown/";
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function artifactPath(root, requestUrl) {
  const pathname = new URL(requestUrl, "http://localhost").pathname;
  if (!pathname.startsWith(sitePrefix)) return { status: 404 };

  const suffix = pathname.slice(sitePrefix.length) || "index.html";
  const requestedPath = suffix.endsWith("/") ? `${suffix}index.html` : suffix;
  const candidate = resolve(root, requestedPath);
  const relativePath = relative(root, candidate);

  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    return { status: 400 };
  }

  return { candidate };
}

async function readRegularFile(path) {
  const handle = await open(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    if (!(await handle.stat()).isFile()) return null;
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

export function artifactServer(directory) {
  const root = resolve(directory);
  return createServer(async (request, response) => {
    const resolved = artifactPath(root, request.url);
    if (!resolved.candidate) return response.writeHead(resolved.status).end();

    try {
      const body = await readRegularFile(resolved.candidate);
      if (!body) return response.writeHead(404).end();
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type":
          mimeTypes[extname(resolved.candidate)] ?? "application/octet-stream",
        "timing-allow-origin": "http://127.0.0.1",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
}

export async function startServer(directory) {
  const server = artifactServer(directory);
  await new Promise((resolveServer) =>
    server.listen(0, "127.0.0.1", resolveServer),
  );
  const address = server.address();
  return { server, origin: `http://127.0.0.1:${address.port}` };
}
