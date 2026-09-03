import { readFile } from "node:fs/promises";
import { test, expect, richClipboard } from "./fixtures";

test("empty state has the purple theme, local fonts, and production CSP", async ({
  app,
  page,
}, info) => {
  await app.open();
  await expect(
    page.getByRole("button", { name: "Paste from Clipboard" }),
  ).toBeVisible();
  await expect(app.editor).toHaveCount(0);
  const style = await page.evaluate(async () => {
    await document.fonts.ready;
    const heading = document.querySelector("h1")!;
    return {
      background: getComputedStyle(document.body).backgroundImage,
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(heading).fontFamily,
      fonts: [...document.fonts]
        .filter((font) => font.status === "loaded")
        .map((font) => font.family),
      csp: document
        .querySelector('meta[http-equiv="Content-Security-Policy"]')
        ?.getAttribute("content"),
    };
  });
  expect(style.background).toContain("gradient");
  expect(style.background).toContain("280");
  expect(style.bodyFont).toContain("Inter Variable");
  expect(style.headingFont).toContain("Space Grotesk Variable");
  expect(style.fonts.some((font) => font.includes("Inter"))).toBe(true);
  expect(style.fonts.some((font) => font.includes("Space Grotesk"))).toBe(true);
  expect(style.csp).toContain("script-src 'self'");
  expect(style.csp).toContain("connect-src 'self'");
  await app.capture("empty", info);
});

test("HTML wins over plain text and link labels retain explicit breaks", async ({
  app,
  page,
}, info) => {
  await app.open();
  await app.paste(richClipboard);
  await expect(app.editor).toHaveValue(
    "# Release notes\n\nA **small** improvement.\n\n[Review the<br>guide](https://example.invalid/guide)\n\n-   First item\n-   Second item",
  );
  expect(
    await app.editor.evaluate(
      (element) => getComputedStyle(element).fontFamily,
    ),
  ).toContain("JetBrains Mono");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    app.preview.getByRole("heading", { name: "Release notes" }),
  ).toBeVisible();
  await expect(
    app.preview.getByRole("link", { name: "Review the guide" }),
  ).toHaveAttribute("href", "https://example.invalid/guide");
  await expect(app.preview.locator("a br")).toHaveCount(1);
  await app.capture("converted-preview", info);
});

test("plain Markdown retains syntax and renders visible bullet and numbered list styles", async ({
  app,
  page,
}) => {
  await app.open();
  const text =
    "# Plain document\n\nA [guide](https://example.invalid/plain) and **emphasis**.\n\n```text\n  preserve spaces\n```\n\n- Bullet item\n\n1. Numbered item";
  await app.paste({ text });
  await expect(app.editor).toHaveValue(text);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(app.preview.getByRole("list")).toHaveCount(2);
  await expect(app.preview.locator("ul")).toHaveCSS("list-style-type", "disc");
  await expect(app.preview.locator("ol")).toHaveCSS(
    "list-style-type",
    "decimal",
  );
  await expect(
    app.preview.getByRole("listitem").filter({ hasText: "Bullet item" }),
  ).toHaveCSS("display", "list-item");
  await expect(
    app.preview.getByRole("listitem").filter({ hasText: "Numbered item" }),
  ).toHaveCSS("display", "list-item");
});

test("preview keeps raster data and same-origin images without requesting remote resources", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "Original" });
  const remoteRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("example.invalid"))
      remoteRequests.push(request.url());
  });
  // A synthetic transparent pixel exercises image decoding without external files.
  const pixel = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  const embeddedSource = `data:image/gif;base64,${pixel}`;
  const localSource = "/paste-to-markdown/fixtures/local.gif";
  const absoluteSource = new URL(localSource, page.url()).href;
  await page.route(`**${localSource}`, (route) =>
    route.fulfill({
      contentType: "image/gif",
      body: Buffer.from(pixel, "base64"),
    }),
  );
  const edited = `# Edited document\n\n**Visible emphasis**\n\n![Embedded pixel](${embeddedSource})\n\n![Local pixel](${localSource})\n\n![Same-origin pixel](${absoluteSource})\n\n![Remote diagram](https://example.invalid/tracker.png)\n\n<script>window.previewExecuted = true</script>\n<img src="https://example.invalid/raw.png" onerror="window.previewExecuted = true">\n<iframe src="https://example.invalid/frame"></iframe>\n[Unsafe](javascript:alert(1))`;
  await app.editor.fill(edited);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(
    app.preview.getByRole("heading", { name: "Edited document" }),
  ).toBeVisible();
  await expect(app.preview.locator("strong")).toHaveText("Visible emphasis");
  await expect(
    app.preview.locator(
      'script, iframe, [srcset], [onerror], [href^="javascript:"]',
    ),
  ).toHaveCount(0);
  await expect(
    app.preview.getByRole("img", { name: "Remote diagram" }),
  ).not.toHaveAttribute("src");
  for (const [name, source] of [
    ["Embedded pixel", embeddedSource],
    ["Local pixel", localSource],
    ["Same-origin pixel", absoluteSource],
  ]) {
    const image = app.preview.getByRole("img", { name, exact: true });
    await expect(image).toHaveAttribute("src", source);
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBe(1);
  }
  await expect(app.preview.locator("img[src]")).toHaveCount(3);
  expect(await page.evaluate(() => "previewExecuted" in window)).toBe(false);
  expect(remoteRequests).toEqual([]);
  await page.getByRole("tab", { name: "Raw Markdown" }).click();
  await expect(app.editor).toHaveValue(edited);
});

test("clear and restore retain edits, preview mode, and source for reconversion", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({
    html: "<p><em>Original source</em></p>",
    text: "Original source",
  });
  await app.editor.fill("# My manual edits");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ready to Convert" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore Last Cleared Content", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Preview", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(
    app.preview.getByRole("heading", { name: "My manual edits" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Raw Markdown" }).click();
  await expect(app.editor).toHaveValue("# My manual edits");
  await app.flavor("CommonMark");
  await page.getByRole("button", { name: "Reconvert", exact: true }).click();
  await expect(app.editor).toHaveValue("*Original source*");
});

test("download contains current edits and does not duplicate the extension", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "Original" });
  const edited =
    "# Downloaded edits\n\nA [link](https://example.invalid/download).\n";
  await app.editor.fill(edited);
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Download Markdown File" });
  await dialog
    .getByRole("textbox", { name: "Filename" })
    .fill(" release-notes.md ");
  const downloadEvent = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("release-notes.md");
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).not.toBeNull();
  expect(await readFile(path!, "utf8")).toBe(edited);
  await expect(dialog).toHaveCount(0);
});

test("About navigation and local assets work under the deployment base path", async ({
  app,
  page,
  request,
}) => {
  await app.open();
  const resources = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
        'script[src], link[rel="stylesheet"], link[rel="icon"]',
      ),
    ].map((element) =>
      element instanceof HTMLScriptElement ? element.src : element.href,
    ),
  );
  expect(resources.length).toBeGreaterThan(1);
  for (const url of resources) {
    expect(new URL(url).pathname).toMatch(/^\/paste-to-markdown\//);
    const response = await request.get(url);
    expect(response.ok(), url).toBe(true);
  }
  await page.getByRole("link", { name: "About This Project" }).click();
  await expect(page).toHaveURL(/\/paste-to-markdown\/about\/$/);
  await expect(
    page.getByRole("heading", { name: "What the tool does" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Privacy model" }),
  ).toBeVisible();
  await page.locator('a[href="/paste-to-markdown/"]').click();
  await expect(
    page.getByRole("heading", { name: "Ready to Convert" }),
  ).toBeVisible();
});
