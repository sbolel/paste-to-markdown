import { test, expect } from "./fixtures";

const imageFeedback =
  "Image-only input is not supported. Copy text or a linked image instead.";

test("image-only keyboard paste preserves ready state, edits, and clear/restore", async ({
  app,
  page,
}) => {
  await app.open();
  const pasteImage = () =>
    page.evaluate(() => {
      const clipboardData = new DataTransfer();
      clipboardData.items.add(
        new File(["synthetic bytes"], "fixture.png", { type: "image/png" }),
      );
      document.body.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  await pasteImage();
  await expect(page.getByText(imageFeedback, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ready to Convert" }),
  ).toBeVisible();
  await app.paste({ html: "<h1>Source</h1>", text: "Source" });
  await app.editor.fill("# Kept edits");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await pasteImage();
  await expect(
    app.preview.getByRole("heading", { name: "Kept edits" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await pasteImage();
  await page
    .getByRole("button", { name: "Restore Last Cleared Content", exact: true })
    .click();
  await expect(
    app.preview.getByRole("heading", { name: "Kept edits" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Raw Markdown" }).click();
  await expect(app.editor).toHaveValue("# Kept edits");
  await app.flavor("Custom Style");
  await page.getByRole("button", { name: "Reconvert", exact: true }).click();
  await expect(app.editor).toHaveValue("Source\n======");
});

for (const fallback of ["empty", "denied"] as const) {
  test(`image-only Paste button explains unsupported input when plain fallback is ${fallback}`, async ({
    app,
    page,
  }) => {
    await app.open();
    await page.evaluate((mode) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          read: async () => [
            {
              types: ["image/png"],
              getType: async () => {
                throw new Error("Image bytes must not be read");
              },
            },
          ],
          readText: async () => {
            if (mode === "denied")
              throw new DOMException("Synthetic denial", "NotAllowedError");
            return "";
          },
        },
      });
    }, fallback);
    await page.getByRole("button", { name: "Paste from Clipboard" }).click();
    await expect(page.getByText(imageFeedback, { exact: true })).toBeVisible();
    await expect(app.editor).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Ready to Convert" }),
    ).toBeVisible();
  });
}

test("blank rich text falls back to literal plain text and empty conversion keeps edits", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ html: " \n ", text: "<b>literal</b> **Markdown**" });
  await expect(app.editor).toHaveValue("<b>literal</b> **Markdown**");
  await app.editor.fill("# Kept edits");
  await app.paste({ html: "<div> </div>" });
  await expect(
    page.getByText("Nothing to convert — paste some rich text.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(app.editor).toHaveValue("# Kept edits");
});

const presets = [
  { name: "GitHub Flavored", bullet: "-", github: true, strict: false },
  { name: "CommonMark", bullet: "-", github: false, strict: false },
  { name: "Strict Markdown", bullet: "*", github: false, strict: true },
  { name: "Custom Style", bullet: "+", github: false, strict: false },
];

for (const preset of presets) {
  test(`${preset.name} preserves mixed formatting through the production React app`, async ({
    app,
    page,
  }, info) => {
    await app.open();
    // Import first to expose the toolbar, then change settings without edits.
    await app.paste({ text: "Initial" });
    await app.flavor(preset.name);
    const remoteRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("example.invalid"))
        remoteRequests.push(request.url());
    });
    await app.paste({
      html:
        '<p>Before.</p><pre><code class="language-md"><span class="line">alpha</span><span class="line">   ```</span><span class="line">  omega</span></code></pre><p>After.</p>' +
        "<p>Inline <code>  a`b  </code> stays padded.</p>" +
        "<table><tr><th>Value</th></tr><tr><td>A|B</td></tr></table>" +
        '<table><tr><td colspan="2"><ul><li><label><input type="checkbox" checked> Done</label></li></ul><p>Owned paragraph</p></td></tr></table>' +
        '<a href="https://example.invalid/a_(b)"><p>First card</p><p>Second line</p></a>' +
        '<p><a href="/guide">Guide</a><img src="blob:synthetic" alt="Sketch"><img src="https://example.invalid/remote.png" alt="Remote diagram"></p>',
      text: "Ignored plain representation",
    });
    const output = await app.editor.inputValue();
    expect(output).not.toContain("Ignored plain representation");
    expect(output).toContain(
      preset.strict
        ? "    alpha\n       ```\n      omega"
        : "````md\nalpha\n   ```\n  omega\n````",
    );
    expect(output).toContain(`${preset.bullet} Row 1`);
    expect(output).toContain("Columns 1-2");
    expect(output).toContain(preset.github ? "[x] Done" : "(checked) Done");
    expect(output).toContain("Guide (unresolved link)");
    expect(output).toContain("Sketch (temporary image)");
    expect(output).toContain("https://example.invalid/a_\\(b\\)");
    if (preset.github) expect(output).toContain("| A\\|B |");
    await page.getByRole("tab", { name: "Preview", exact: true }).click();
    expect(await app.preview.locator("pre code").textContent()).toBe(
      "alpha\n   ```\n  omega\n",
    );
    expect(await app.preview.locator("p code").textContent()).toBe("  a`b  ");
    await expect(app.preview.locator("table")).toHaveCount(
      preset.github ? 1 : 0,
    );
    const ownedCell = app.preview.locator("li").filter({
      has: page.locator(":scope > p", { hasText: /^Columns 1-2$/ }),
    });
    await expect(ownedCell).toHaveCount(1);
    await expect(ownedCell).toContainText("Owned paragraph");
    await expect(ownedCell).toContainText("Done");
    const card = app.preview.getByRole("link", {
      name: "First card Second line",
      exact: true,
    });
    await expect(card).toHaveAttribute("href", "https://example.invalid/a_(b)");
    expect(output).toContain(
      "[First card Second line](https://example.invalid/a_\\(b\\))",
    );
    await expect(
      app.preview.getByRole("img", { name: "Remote diagram" }),
    ).not.toHaveAttribute("src");
    expect(remoteRequests).toEqual([]);
    if (preset.github) await app.capture("integrated-formatting", info);
  });
}

test("partial table selections retain trailing prose and Strict whitespace code is safe", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({
    html: '<td><a href="/guide">Selected guide</a></td><p>After selection.</p>',
  });
  await expect(app.editor).toHaveValue(
    /Column 1[\s\S]*Selected guide \(unresolved link\)[\s\S]*After selection\./,
  );
  await app.flavor("Strict Markdown");
  await app.paste({
    html: "<pre><code>\n&lt;script&gt;literal&lt;/script&gt;\n\n</code></pre>",
  });
  await expect(app.editor).toHaveValue(
    "<pre><code>\n&lt;script&gt;literal&lt;/script&gt;\n\n</code></pre>",
  );
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  expect(await app.preview.locator("pre code").textContent()).toBe(
    "\n<script>literal</script>\n\n",
  );
  await expect(app.preview.locator("script")).toHaveCount(0);
});
