import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  test as base,
  expect,
  type Page,
  type TestInfo,
} from "@playwright/test";

// Authored fixtures only; no copied documents, provider labels, or real accounts.
export const richClipboard = {
  html: '<h1>Release notes</h1><p>A <strong>small</strong> improvement.</p><p><a href="https://example.invalid/guide">  Review <span>the</span><br> guide  </a></p><ul><li>First item</li><li>Second item</li></ul>',
  text: "This plain representation must not replace the rich document.",
};

export class MarkdownPage {
  constructor(readonly page: Page) {}
  get editor() {
    return this.page.getByRole("textbox", { name: "Markdown Output" });
  }
  get preview() {
    return this.page.getByTestId("markdown-preview");
  }
  get spacing() {
    return this.page.getByRole("switch", {
      name: "Remove blank lines in lists",
    });
  }

  async open() {
    await this.page.goto("./");
    await expect(
      this.page.getByRole("heading", { name: "Ready to Convert" }),
    ).toBeVisible();
  }

  async paste(source: { html?: string; text?: string }) {
    await this.page.evaluate(({ html = "", text = "" }) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/html", html);
      clipboardData.setData("text/plain", text);
      document.body.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, source);
    await expect(
      this.page.getByRole("tab", { name: "Raw Markdown" }),
    ).toBeVisible();
  }

  async flavor(name: string) {
    await this.page.getByRole("combobox").click();
    await this.page.getByRole("option", { name, exact: true }).click();
  }

  async selectAll() {
    await this.editor.focus();
    await this.editor.evaluate((element: HTMLTextAreaElement) =>
      element.setSelectionRange(0, element.value.length),
    );
  }

  async capture(name: string, info: TestInfo) {
    const directory =
      process.env.QA_SCREENSHOT_DIR ?? join(tmpdir(), "purple-restoration-qa");
    await mkdir(directory, { recursive: true });
    await this.page.screenshot({
      path: join(directory, `${info.project.name}-${name}.png`),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  }
}

export const test = base.extend<{
  app: MarkdownPage;
  browserDiagnostics: void;
}>({
  app: async ({ page }, use) => {
    // Browser integration uses synthetic clipboard events or explicit API stubs.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
    });
    await use(new MarkdownPage(page));
  },
  browserDiagnostics: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("response", (response) => {
        if (response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await use();
      expect(
        errors,
        "No runtime, console, CSP, or failed asset responses",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
