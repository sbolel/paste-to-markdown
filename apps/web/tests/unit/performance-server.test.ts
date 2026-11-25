// @vitest-environment node
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { startServer } from "../../scripts/performance-server.mjs";

const temporaryDirectories: string[] = [];
const servers: Awaited<ReturnType<typeof startServer>>["server"][] = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolveServer, reject) =>
            server.close((error) => (error ? reject(error) : resolveServer())),
          ),
      ),
  );
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixtureServer() {
  const container = await mkdtemp(join(tmpdir(), "ptm-performance-server-"));
  temporaryDirectories.push(container);
  const root = join(container, "dist");
  await mkdir(join(root, "about"), { recursive: true });
  await writeFile(join(root, "index.html"), "<h1>Homepage</h1>");
  await writeFile(join(root, "about", "index.html"), "<h1>About</h1>");
  await writeFile(join(root, "main.js"), "console.log('ready');");
  const running = await startServer(root);
  servers.push(running.server);
  return { ...running, container, root };
}

describe("performance artifact server", () => {
  it("serves regular files and explicit directory indexes", async () => {
    const { origin } = await fixtureServer();

    const homepage = await fetch(`${origin}/paste-to-markdown/`);
    expect(homepage.status).toBe(200);
    expect(homepage.headers.get("cache-control")).toBe("no-store");
    expect(homepage.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(await homepage.text()).toBe("<h1>Homepage</h1>");

    const about = await fetch(`${origin}/paste-to-markdown/about/`);
    expect(about.status).toBe(200);
    expect(await about.text()).toBe("<h1>About</h1>");

    const script = await fetch(`${origin}/paste-to-markdown/main.js`);
    expect(script.status).toBe(200);
    expect(script.headers.get("content-type")).toBe(
      "text/javascript; charset=utf-8",
    );
  });

  it("rejects missing, directory, traversal, and symlink targets", async () => {
    const { origin, container, root } = await fixtureServer();
    const secret = join(container, "secret.txt");
    await writeFile(secret, "outside artifact root");
    await symlink(secret, join(root, "linked.txt"));

    const paths = [
      "/paste-to-markdown/missing.txt",
      "/paste-to-markdown/about",
      "/paste-to-markdown/%2e%2e/secret.txt",
      "/paste-to-markdown/linked.txt",
    ];
    for (const path of paths) {
      const response = await fetch(`${origin}${path}`);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(await response.text()).not.toContain("outside artifact root");
    }
  });
});
