import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { JSDOM } from "jsdom";

const base = "/paste-to-markdown/";
const origin = "https://sbolel.github.io";
const text = (node) => node.textContent.replace(/\s+/g, " ").trim();

function assertPreservedHead(source, built) {
  assert.equal(built.querySelectorAll("title").length, 1);
  assert.equal(built.title, source.title);
  for (const attribute of ["name", "property"]) {
    for (const meta of source.head.querySelectorAll(`meta[${attribute}]`)) {
      const matches = [
        ...built.head.querySelectorAll(`meta[${attribute}]`),
      ].filter(
        (candidate) =>
          candidate.getAttribute(attribute) === meta.getAttribute(attribute),
      );
      assert.equal(matches.length, 1, `Unique metadata: ${meta.outerHTML}`);
      assert.equal(matches[0].content, meta.content);
    }
  }
  for (const rel of ["canonical", "author"]) {
    assert.equal(built.querySelectorAll(`link[rel="${rel}"]`).length, 1);
    assert.equal(
      built.querySelector(`link[rel="${rel}"]`).getAttribute("href"),
      source.querySelector(`link[rel="${rel}"]`).getAttribute("href"),
    );
  }
  const json = (doc) =>
    [...doc.querySelectorAll('script[type="application/ld+json"]')].map(
      (node) => JSON.parse(node.textContent),
    );
  assert.deepEqual(
    json(built),
    json(source),
    "Structured data must stay unchanged",
  );
  const policies = built.querySelectorAll(
    'meta[http-equiv="Content-Security-Policy"]',
  );
  assert.equal(policies.length, 1, "Exactly one production CSP");
  assert.equal(
    policies[0].content,
    "default-src 'self'; base-uri 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self'",
  );
}

function assertHomepage(document) {
  const roots = document.querySelectorAll('[id="root"]');
  assert.equal(roots.length, 1, "Exactly one prerendered root");
  const root = roots[0];
  assert.equal(root.querySelectorAll("h1").length, 1);
  assert.equal(text(root.querySelector("h1")), "Paste to Markdown");
  const ready = [...root.querySelectorAll("h2")].filter(
    (node) => text(node) === "Ready to Convert",
  );
  assert.equal(ready.length, 1, "Exactly one ready-state heading");
  for (const description of [
    "Convert any HTML content into clean Markdown",
    "Paste to get started. Markdown will appear instantly.",
    "Conversion requires JavaScript and runs locally in your browser.",
  ]) {
    assert.equal(
      [...root.querySelectorAll("p")].filter(
        (node) => text(node) === description,
      ).length,
      1,
    );
  }
  for (const href of [
    base + "about/",
    "https://github.com/sbolel/paste-to-markdown",
    "https://sinanbolel.com/",
  ]) {
    assert.equal(
      root.querySelectorAll(`a[href="${href}"]`).length,
      1,
      `Crawlable link: ${href}`,
    );
  }
  assert.match(text(root), /Built by Sinan Bolel/);
  const paste = [...root.querySelectorAll("button")].filter(
    (node) => text(node) === "Paste from Clipboard",
  );
  assert.equal(paste.length, 1);
  assert(paste[0].disabled, "Conversion stays disabled before initialization");
  for (const node of [
    root.querySelector("h1"),
    ...ready,
    ...root.querySelectorAll("p,a"),
  ]) {
    for (let ancestor = node; ancestor; ancestor = ancestor.parentElement) {
      assert(!ancestor.hidden, "Public content must not start hidden");
      assert.notEqual(ancestor.style.display, "none");
      assert.notEqual(ancestor.style.visibility, "hidden");
      assert(
        Number(ancestor.style.opacity || 1) > 0,
        "Public content must not start transparent",
      );
    }
  }
  const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length, "No duplicate element IDs");
}

export async function checkPrerenderArtifact(artifactDir) {
  const documents = [];
  try {
    for (const page of ["index.html", "about/index.html"]) {
      const source = new JSDOM(
        await readFile(new URL(`../${page}`, import.meta.url), "utf8"),
      );
      const built = new JSDOM(await readFile(join(artifactDir, page), "utf8"));
      documents.push(source, built);
      assertPreservedHead(source.window.document, built.window.document);
      if (page === "index.html") assertHomepage(built.window.document);
      for (const element of built.window.document.querySelectorAll(
        'script[src],link[rel="stylesheet"],link[rel="icon"]',
      )) {
        const url = new URL(
          element.getAttribute("src") ?? element.getAttribute("href"),
          origin,
        );
        assert.equal(url.origin, origin, "Assets stay on origin");
        assert(
          url.pathname.startsWith(base),
          "Assets retain the Pages base path",
        );
        await access(join(artifactDir, url.pathname.slice(base.length)));
      }
    }
    const publicFiles = [
      "404.html",
      "robots.txt",
      "sitemap.xml",
      "google0602f969983537ca.html",
      "favicon.svg",
      "og/paste-to-markdown-social.png",
      "og/paste-to-markdown-social.svg",
      "font-licenses/inter.txt",
      "font-licenses/space-grotesk.txt",
      "font-licenses/jetbrains-mono.txt",
    ];
    for (const file of publicFiles) {
      assert.deepEqual(
        await readFile(join(artifactDir, file)),
        await readFile(new URL(`../../../public/${file}`, import.meta.url)),
        `Preserve public/${file}`,
      );
    }
    const files = await readdir(artifactDir, { recursive: true });
    assert(
      !files.some((file) =>
        /(?:entry-server|homepage-render-|dist-ssr)/.test(file),
      ),
      "No build-only renderer in deployed output",
    );
    for (const family of ["inter", "space-grotesk", "jetbrains-mono"]) {
      assert(
        files.some(
          (file) =>
            file.includes(`${family}-latin-wght-normal-`) &&
            file.endsWith(".woff2"),
        ),
        `Local ${family} font`,
      );
    }
    for (const file of files.filter((name) => name.endsWith(".css"))) {
      const css = await readFile(join(artifactDir, file), "utf8");
      for (const match of css.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)) {
        const url = new URL(match[1], `${origin}${base}${file}`);
        assert.equal(url.origin, origin);
        assert(url.pathname.startsWith(base));
        await access(join(artifactDir, url.pathname.slice(base.length)));
      }
    }
  } finally {
    for (const document of documents) document.window.close();
  }
}
