import { test, expect } from "./fixtures";

const shortcuts = [
  { label: "bold", keys: "ControlOrMeta+b", result: "**sample**" },
  { label: "italic", keys: "ControlOrMeta+i", result: "_sample_" },
  { label: "strikethrough", keys: "ControlOrMeta+d", result: "~~sample~~" },
  { label: "inline code", keys: "ControlOrMeta+e", result: "`sample`" },
  {
    label: "code block",
    keys: "ControlOrMeta+Shift+c",
    result: "```\nsample\n```",
  },
  { label: "heading 1", keys: "ControlOrMeta+1", result: "# sample" },
  { label: "heading 2", keys: "ControlOrMeta+2", result: "## sample" },
  { label: "heading 3", keys: "ControlOrMeta+3", result: "### sample" },
  { label: "link", keys: "ControlOrMeta+k", result: "[sample](url)" },
  { label: "quote", keys: "ControlOrMeta+Shift+q", result: "> sample" },
  { label: "bullet list", keys: "ControlOrMeta+Shift+l", result: "- sample" },
  {
    label: "numbered list",
    keys: "ControlOrMeta+Shift+o",
    result: "1. sample",
  },
];

test("all documented formatting shortcuts update only the selected editor text", async ({
  app,
}) => {
  await app.open();
  await app.paste({ text: "sample" });
  for (const shortcut of shortcuts) {
    await test.step(shortcut.label, async () => {
      await app.editor.fill("before sample after");
      await app.editor.focus();
      await app.editor.evaluate((element: HTMLTextAreaElement) =>
        element.setSelectionRange(7, 13),
      );
      await app.editor.press(shortcut.keys);
      await expect(app.editor).toHaveValue(`before ${shortcut.result} after`);
      await expect(app.editor).toBeFocused();
    });
  }
});

test("native editor undo and redo survive Preview round-trips", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "sample" });
  await app.selectAll();
  await app.editor.press("ControlOrMeta+b");
  await expect(app.editor).toHaveValue("**sample**");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(app.preview.locator("strong")).toHaveText("sample");
  await expect(app.editor).toBeHidden();
  await page.getByRole("tab", { name: "Raw Markdown" }).click();
  await app.editor.press("ControlOrMeta+z");
  await expect(app.editor).toHaveValue("sample");
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(app.preview).toHaveText("sample");
  await page.getByRole("tab", { name: "Raw Markdown" }).click();
  await app.editor.press("ControlOrMeta+Shift+z");
  await expect(app.editor).toHaveValue("**sample**");
});

for (const preset of [
  {
    name: "GitHub Flavored",
    bold: "**sample**",
    italic: "_sample_",
    bullet: "- sample",
    heading: "# sample",
    block: "```\nsample\n```",
  },
  {
    name: "CommonMark",
    bold: "**sample**",
    italic: "*sample*",
    bullet: "- sample",
    heading: "# sample",
    block: "```\nsample\n```",
  },
  {
    name: "Strict Markdown",
    bold: "**sample**",
    italic: "*sample*",
    bullet: "* sample",
    heading: "# sample",
    block: "    sample",
  },
  {
    name: "Custom Style",
    bold: "__sample__",
    italic: "_sample_",
    bullet: "+ sample",
    heading: "sample\n======",
    block: "```\nsample\n```",
  },
]) {
  test(`shortcuts use the effective ${preset.name} preset`, async ({ app }) => {
    await app.open();
    await app.paste({ text: "sample" });
    await app.flavor(preset.name);
    for (const [keys, expected] of [
      ["ControlOrMeta+b", preset.bold],
      ["ControlOrMeta+i", preset.italic],
      ["ControlOrMeta+Shift+l", preset.bullet],
      ["ControlOrMeta+1", preset.heading],
      ["ControlOrMeta+Shift+c", preset.block],
      ["ControlOrMeta+d", "~~sample~~"],
    ]) {
      await app.editor.fill("sample");
      await app.selectAll();
      await app.editor.press(keys);
      await expect(app.editor).toHaveValue(expected);
    }
  });
}

test("shortcuts keep the original flavor after cancellation and use the confirmed flavor", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "sample" });
  await app.editor.fill("edited");
  await app.flavor("Custom Style");
  const dialog = page.getByRole("dialog", {
    name: "Replace your Markdown edits?",
  });
  await dialog.getByRole("button", { name: "Keep my edits" }).click();
  await app.selectAll();
  await app.editor.press("ControlOrMeta+b");
  await expect(app.editor).toHaveValue("**edited**");
  await app.flavor("Custom Style");
  await dialog.getByRole("button", { name: "Reconvert", exact: true }).click();
  await app.selectAll();
  await app.editor.press("ControlOrMeta+b");
  await expect(app.editor).toHaveValue("__sample__");
});

test("link shortcuts put the caret at the URL for selected and empty labels", async ({
  app,
}) => {
  await app.open();
  await app.paste({ text: "sample" });
  for (const label of ["", "label"]) {
    await app.editor.fill(`before ${label} after`);
    await app.editor.focus();
    await app.editor.evaluate(
      (element: HTMLTextAreaElement, length) =>
        element.setSelectionRange(7, 7 + length),
      label.length,
    );
    await app.editor.press("ControlOrMeta+k");
    expect(
      await app.editor.evaluate((element: HTMLTextAreaElement) => ({
        start: element.selectionStart,
        end: element.selectionEnd,
      })),
    ).toEqual({
      start: 7 + (label || "link text").length + 3,
      end: 7 + (label || "link text").length + 3,
    });
    await app.editor.pressSequentially("guide-");
    await expect(app.editor).toHaveValue(
      `before [${label || "link text"}](guide-url) after`,
    );
  }
});

test("the code-block shortcut preserves embedded Markdown fences in Preview", async ({
  app,
  page,
}) => {
  const source = "before\n````\n```nested```\n````\nafter";
  await app.open();
  await app.paste({ text: source });
  await app.selectAll();
  await app.editor.press("ControlOrMeta+Shift+c");
  await expect(app.editor).toHaveValue(`\`\`\`\`\`\n${source}\n\`\`\`\`\``);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(app.preview.locator("pre > code")).toHaveCount(1);
  expect(await app.preview.locator("pre > code").textContent()).toBe(
    `${source}\n`,
  );
  await expect(app.preview.locator("p")).toHaveCount(0);
  await page.getByRole("tab", { name: "Raw Markdown" }).click();
  await app.editor.press("ControlOrMeta+z");
  await expect(app.editor).toHaveValue(source);
});

test("formatting and help shortcuts leave the focused filename unchanged", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "Editor remains intact" });
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const filename = page.getByRole("textbox", { name: "Filename" });
  await filename.fill("release-notes");
  for (const shortcut of shortcuts) {
    await filename.press(shortcut.keys);
    await expect(filename).toHaveValue("release-notes");
  }
  await filename.press("ControlOrMeta+/");
  await expect(
    page.getByRole("dialog", { name: "Keyboard Shortcuts" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(app.editor).toHaveValue("Editor remains intact");
});

test("cheatsheet and shortcut help open and close accessibly", async ({
  app,
  page,
}, info) => {
  await app.open();
  await app.paste({ text: "Help document" });
  await page
    .getByRole("button", { name: "Markdown cheatsheet", exact: true })
    .click();
  const cheatsheet = page.getByRole("dialog", { name: "Markdown Cheatsheet" });
  await expect(
    cheatsheet.getByRole("heading", { name: "Headings", exact: true }),
  ).toBeVisible();
  await expect(
    cheatsheet.getByRole("heading", { name: "Tables", exact: true }),
  ).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(cheatsheet).toHaveCount(0);
  await page
    .getByRole("button", { name: "Keyboard shortcuts", exact: true })
    .click();
  const help = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
  await expect(help.getByText("Bold", { exact: true })).toBeVisible();
  await expect(
    help.getByText(/Strikethrough remains available in every flavor/),
  ).toBeVisible();
  await app.capture("shortcut-help", info);
  await help.getByRole("button", { name: "Got it" }).click();
  // Finish the close transition before focusing the underlying editor again.
  await expect(help).toHaveCount(0);
  await app.editor.press("ControlOrMeta+/");
  // Keyboard dismissal is checked once the animated modal is interactive.
  await help.getByRole("button", { name: "Got it" }).click({ trial: true });
  await expect(help.getByRole("button", { name: "Got it" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(help).toHaveCount(0);
  await expect(app.editor).toBeFocused();
});

test("mobile layout stays inside the viewport through editing and dialogs", async ({
  app,
  page,
}, info) => {
  test.skip(
    info.project.name !== "chromium-mobile",
    "Dedicated narrow touch viewport check",
  );
  const expectNoOverflow = async () => {
    expect(
      await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      })),
    ).toEqual({ viewport: 390, content: 390 });
  };
  const expectActionsInsideCard = async () => {
    for (const name of ["Copy", "Clear", "Download"]) {
      const button = page.getByRole("button", { name, exact: true });
      await expect(button).toBeVisible();
      await expect
        .poll(
          async () =>
            button.evaluate((element) => {
              const card = element.closest('[data-slot="card"]');
              if (!card) return false;
              const buttonBounds = element.getBoundingClientRect();
              const cardBounds = card.getBoundingClientRect();
              return (
                buttonBounds.left >= cardBounds.left - 1 &&
                buttonBounds.right <= cardBounds.right + 1 &&
                buttonBounds.top >= cardBounds.top - 1 &&
                buttonBounds.bottom <= cardBounds.bottom + 1
              );
            }),
          { message: `${name} stays within the output card` },
        )
        .toBe(true);
    }
  };
  await app.open();
  await expectNoOverflow();
  await app.paste({ text: "# Mobile document\n\n" + "long-word-".repeat(60) });
  await expectNoOverflow();
  await expectActionsInsideCard();
  await expect(page.getByTestId("cursor-sparkles")).toHaveCount(0);
  await app.capture("mobile-editor", info);
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expectNoOverflow();
  await expectActionsInsideCard();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Download Markdown File" }),
  ).toBeVisible();
  await expectNoOverflow();
  await app.capture("mobile-download", info);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("button", { name: "Keyboard shortcuts", exact: true })
    .click();
  await expectNoOverflow();
});

test("reduced motion suppresses particles and animated page backgrounds", async ({
  app,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await app.open();
  await page.mouse.move(180, 190);
  await page.mouse.move(320, 290, { steps: 8 });
  await expect(page.getByTestId("cursor-sparkles")).toHaveCount(0);
  expect(
    await page.evaluate(() => [
      getComputedStyle(document.body).animationName,
      getComputedStyle(document.body, "::before").animationName,
    ]),
  ).toEqual(["none", "none"]);
});
