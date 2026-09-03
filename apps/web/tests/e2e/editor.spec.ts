import { test, expect } from "./fixtures";

const shortcuts = [
  { label: "bold", keys: "ControlOrMeta+b", result: "**sample**" },
  { label: "italic", keys: "ControlOrMeta+i", result: "*sample*" },
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
  await app.capture("shortcut-help", info);
  await help.getByRole("button", { name: "Got it" }).click();
  await app.editor.press("ControlOrMeta+/");
  await expect(help).toBeVisible();
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
