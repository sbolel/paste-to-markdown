import { test, expect, richClipboard } from "./fixtures";

declare global {
  interface Window {
    clipboardWrites?: string[];
    fallbackCopy?: string;
    fallbackAttempts?: number;
  }
}

test("Paste button prefers clipboard HTML when the API is available", async ({
  app,
  page,
}) => {
  await app.open();
  await page.evaluate((source) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        read: async () => [
          {
            types: ["text/html", "text/plain"],
            getType: async (type: string) =>
              new Blob([type === "text/html" ? source.html : source.text], {
                type,
              }),
          },
        ],
      },
    });
  }, richClipboard);
  await page.getByRole("button", { name: "Paste from Clipboard" }).click();
  await expect(app.editor).toHaveValue(/# Release notes/);
  expect(await app.editor.inputValue()).not.toContain(richClipboard.text);
});

test("denied rich clipboard access falls back to plain text", async ({
  app,
  page,
}) => {
  await app.open();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        read: async () => {
          throw new DOMException(
            "Synthetic permission denial",
            "NotAllowedError",
          );
        },
        readText: async () => "# Plain API fallback",
      },
    });
  });
  await page.getByRole("button", { name: "Paste from Clipboard" }).click();
  await expect(app.editor).toHaveValue("# Plain API fallback");
});

test("missing clipboard access explains the keyboard paste path", async ({
  app,
  page,
}) => {
  await app.open();
  await page.getByRole("button", { name: "Paste from Clipboard" }).click();
  await expect(
    page.getByText(
      "Unable to read clipboard. Please use Ctrl+V or ⌘+V to paste.",
      { exact: true },
    ),
  ).toBeVisible();
  await app.paste({ text: "Keyboard paste still works" });
  await expect(app.editor).toHaveValue("Keyboard paste still works");
});

test("Copy writes the edited document through the available API", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "Original" });
  await app.editor.fill("**Edited copy**");
  await page.evaluate(() => {
    window.clipboardWrites = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          window.clipboardWrites!.push(text);
        },
      },
    });
    document.execCommand = () => {
      throw new Error("Fallback should not run after successful writeText");
    };
  });
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(
    page.getByText("Markdown copied to clipboard", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.clipboardWrites)).toEqual([
    "**Edited copy**",
  ]);
});

for (const availability of ["missing", "rejected"] as const) {
  test(`Copy uses execCommand when the clipboard API is ${availability}`, async ({
    app,
    page,
  }) => {
    await app.open();
    await app.paste({ text: "Fallback copy content" });
    await page.evaluate((mode) => {
      if (mode === "rejected")
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async () => {
              throw new DOMException("Synthetic denial", "NotAllowedError");
            },
          },
        });
      window.fallbackAttempts = 0;
      document.execCommand = (command: string) => {
        if (command !== "copy")
          throw new Error(`Unexpected command: ${command}`);
        window.fallbackAttempts! += 1;
        window.fallbackCopy = (
          document.activeElement as HTMLTextAreaElement
        ).value;
        return true;
      };
    }, availability);
    await page.getByRole("button", { name: "Copy", exact: true }).click();
    await expect(
      page.getByText("Markdown copied to clipboard", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => ({
        text: window.fallbackCopy,
        attempts: window.fallbackAttempts,
      })),
    ).toEqual({ text: "Fallback copy content", attempts: 1 });
    await expect(
      page.getByRole("textbox", { name: "Markdown copy buffer" }),
    ).toHaveCount(0);
  });
}

test("failed copy from Preview activates Raw, selects the editor, and gives manual guidance", async ({
  app,
  page,
}) => {
  await app.open();
  await app.paste({ text: "Select this Markdown" });
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(app.preview).toHaveText("Select this Markdown");
  await page.evaluate(() => {
    document.execCommand = () => false;
  });
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(
    page.getByText(
      "Unable to copy automatically. Select the Markdown and press Ctrl+C or ⌘+C.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Raw Markdown" })).toHaveAttribute(
    "data-state",
    "active",
  );
  await expect(app.preview).toBeHidden();
  await expect(app.editor).toBeFocused();
  expect(
    await app.editor.evaluate((element: HTMLTextAreaElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([0, "Select this Markdown".length]);
  await expect(
    page.getByRole("textbox", { name: "Markdown copy buffer" }),
  ).toHaveCount(0);
});
