import { test, expect } from "./fixtures";

test("untouched source reconverts immediately when spacing changes", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "- First item\n\n- Second item" });
  await expect(app.editor).toHaveValue("- First item\n- Second item");
  await app.spacing.click();
  await expect(app.editor).toHaveValue("- First item\n\n- Second item");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await app.spacing.click();
  await expect(app.editor).toHaveValue("- First item\n- Second item");
});

test("untouched HTML immediately uses the selected Markdown flavor", async ({
  app,
}) => {
  await app.open();
  await app.paste({ html: "<p><em>Styled source</em></p>" });
  await expect(app.editor).toHaveValue("_Styled source_");
  await app.flavor("CommonMark");
  await expect(app.editor).toHaveValue("*Styled source*");
  await app.flavor("Custom Style");
  await expect(app.editor).toHaveValue("_Styled source_");
});

test("dirty edits survive cancellation and are replaced only after confirmation", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ html: "<p><em>Original source</em></p>" });
  await app.editor.fill("My carefully edited document");
  await app.flavor("CommonMark");
  const dialog = page.getByRole("dialog", {
    name: "Replace your Markdown edits?",
  });
  await expect(dialog).toBeVisible();
  // The modal correctly hides background controls from the accessibility tree.
  await expect(page.locator("#markdown-output")).toHaveValue(
    "My carefully edited document",
  );
  await dialog.getByRole("button", { name: "Keep my edits" }).click();
  await expect(app.editor).toHaveValue("My carefully edited document");
  await expect(page.getByRole("combobox")).toContainText("GitHub Flavored");
  await app.flavor("CommonMark");
  await dialog.getByRole("button", { name: "Reconvert", exact: true }).click();
  await expect(app.editor).toHaveValue("*Original source*");
  await expect(page.getByRole("combobox")).toContainText("CommonMark");
});

test("spacing changes also protect dirty edits until confirmed", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "- First item\n\n- Second item" });
  await app.editor.fill("Edited list");
  await app.spacing.click();
  const dialog = page.getByRole("dialog", {
    name: "Replace your Markdown edits?",
  });
  await dialog.getByRole("button", { name: "Keep my edits" }).click();
  await expect(app.spacing).toBeChecked();
  await expect(app.editor).toHaveValue("Edited list");
  await app.spacing.click();
  await dialog.getByRole("button", { name: "Reconvert", exact: true }).click();
  await expect(app.spacing).not.toBeChecked();
  await expect(app.editor).toHaveValue("- First item\n\n- Second item");
});

test("preferences persist across reload while document content stays in memory", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ html: "<p>Private synthetic document</p>" });
  await app.flavor("Strict Markdown");
  await app.spacing.click();
  expect(
    await page.evaluate(() => Object.fromEntries(Object.entries(localStorage))),
  ).toEqual({
    "markdown-flavor": '"strict"',
    "remove-blank-lines": "false",
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ready to Convert" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Restore Last Cleared Content" }),
  ).toHaveCount(0);
  await app.paste({ html: "<p>Fresh document</p>" });
  await expect(page.getByRole("combobox")).toContainText("Strict Markdown");
  await expect(app.spacing).not.toBeChecked();
  await expect(app.editor).toHaveValue("Fresh document");
});

for (const storage of ["corrupt", "wrong-types", "unavailable"] as const) {
  test(`${storage} preference storage falls back without breaking conversion`, async ({
    app,
    page,
  }) => {
    await page.addInitScript((mode) => {
      if (mode === "unavailable") {
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() {
            throw new DOMException(
              "Synthetic storage restriction",
              "SecurityError",
            );
          },
        });
      } else {
        localStorage.setItem(
          "markdown-flavor",
          mode === "corrupt" ? "{broken" : '"unsupported-flavor"',
        );
        localStorage.setItem(
          "remove-blank-lines",
          mode === "corrupt" ? "{broken" : '"false"',
        );
      }
    }, storage);
    await app.open();
    await app.paste({ text: "Storage-independent content" });
    await expect(app.editor).toHaveValue("Storage-independent content");
    await expect(page.getByRole("combobox")).toContainText("GitHub Flavored");
    await expect(app.spacing).toBeChecked();
    await app.flavor("CommonMark");
    await expect(page.getByRole("combobox")).toContainText("CommonMark");
  });
}
