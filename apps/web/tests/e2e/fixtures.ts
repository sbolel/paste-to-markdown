import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  test as base,
  expect,
  type Page,
  type TestInfo,
} from "@playwright/test";

export type BrowserDiagnostics = {
  allowConsoleError(message: string): void;
  allowRequestFailure(url: string, errorText: string): void;
  monitor(page: Page): Promise<void>;
};

/** Keep custom Playwright contexts equivalent to the normal app fixture. */
export async function prepareBrowserPage(page: Page) {
  // Browser integration uses synthetic clipboard events or explicit API stubs.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });
}

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
    await expect(
      this.page.getByRole("button", { name: "Paste from Clipboard" }),
    ).toBeEnabled();
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
  browserDiagnostics: BrowserDiagnostics;
}>({
  app: async ({ page }, use) => {
    await prepareBrowserPage(page);
    await use(new MarkdownPage(page));
  },
  browserDiagnostics: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const allowedConsoleErrors = new Set<string>();
      const allowedRequestFailures = new Map<string, string>();
      const monitoredPages = new WeakSet<Page>();
      const monitor = async (target: Page) => {
        if (monitoredPages.has(target)) return;
        monitoredPages.add(target);
        await target.addInitScript(() => {
          window.addEventListener("securitypolicyviolation", (event) => {
            console.error(
              `CSP violation: ${event.violatedDirective} blocked ${event.blockedURI}`,
            );
          });
        });
        target.on("pageerror", (error) => errors.push(error.message));
        target.on("console", (message) => {
          if (
            (message.type() === "error" ||
              (message.type() === "warning" &&
                /hydrat/i.test(message.text()))) &&
            !allowedConsoleErrors.has(message.text())
          )
            errors.push(message.text());
        });
        target.on("response", (response) => {
          if (response.status() >= 400)
            errors.push(`${response.status()} ${response.url()}`);
        });
        target.on("requestfailed", (request) => {
          const expectedError = allowedRequestFailures.get(request.url());
          if (request.failure()?.errorText !== expectedError) {
            errors.push(
              `requestfailed ${request.url()}: ${request.failure()?.errorText ?? "unknown"}`,
            );
          }
        });
      };
      await monitor(page);
      await use({
        allowConsoleError: (message) => allowedConsoleErrors.add(message),
        allowRequestFailure: (url, errorText) =>
          allowedRequestFailures.set(url, errorText),
        monitor,
      });
      expect(
        errors,
        "No runtime, console, CSP, or failed asset responses",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
