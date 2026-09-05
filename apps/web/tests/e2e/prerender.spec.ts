import { test, expect, prepareBrowserPage, richClipboard } from "./fixtures";
import type { APIRequestContext, JSHandle, Page } from "@playwright/test";

const baseURL = "http://127.0.0.1:5187/paste-to-markdown/";

const publicCopy = {
  title: "Paste to Markdown",
  description: "Convert any HTML content into clean Markdown",
  ready: "Ready to Convert",
  helper: "Conversion requires JavaScript and runs locally in your browser.",
} as const;

const visibleStaticPage = async (page: Page) => {
  await expect(
    page.getByRole("heading", { name: publicCopy.title }),
  ).toBeVisible();
  await expect(
    page.getByText(publicCopy.description, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: publicCopy.ready }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sinan Bolel", exact: true }).locator(".."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "About This Project", exact: true }),
  ).toBeVisible();
};

async function assertStyledPublicNodes(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const publicNodes = [
            document.querySelector("h1"),
            [...document.querySelectorAll("p")].find(
              (node) =>
                node.textContent?.trim() ===
                "Convert any HTML content into clean Markdown",
            ),
            [...document.querySelectorAll("h2")].find(
              (node) => node.textContent?.trim() === "Ready to Convert",
            ),
            document.querySelector('a[href="https://sinanbolel.com/"]')
              ?.parentElement,
            document.querySelector('a[href$="/about/"]'),
          ];
          const allVisible = publicNodes.every((node) => {
            if (!(node instanceof HTMLElement)) return false;
            for (
              let current: HTMLElement | null = node;
              current;
              current = current.parentElement
            ) {
              const style = getComputedStyle(current);
              if (
                style.display === "none" ||
                style.visibility === "hidden" ||
                Number(style.opacity) === 0
              )
                return false;
            }
            return node.getBoundingClientRect().width > 0;
          });
          const fonts = [...document.fonts]
            .filter((font) => font.status === "loaded")
            .map((font) => font.family);
          return {
            allVisible,
            hasInter: fonts.some((font) => font.includes("Inter")),
            hasSpaceGrotesk: fonts.some((font) =>
              font.includes("Space Grotesk"),
            ),
          };
        }),
      {
        message: "public prerendered content stays styled and uses local fonts",
      },
    )
    .toEqual({ allVisible: true, hasInter: true, hasSpaceGrotesk: true });
}

async function moduleRequests(request: APIRequestContext) {
  const response = await request.get("./");
  expect(response.ok()).toBe(true);
  const html = await response.text();
  const srcs = [
    ...html.matchAll(
      /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["']/gi,
    ),
  ].map((match) => new URL(match[1], response.url()).href);
  const preloads = [
    ...html.matchAll(
      /<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+)["']/gi,
    ),
  ].map((match) => new URL(match[1], response.url()).href);
  expect(srcs, "production HTML declares module entrypoints").not.toEqual([]);
  return { html, preloads, srcs };
}

test("production HTML includes a functional public empty state before JavaScript", async ({
  request,
}) => {
  const { html } = await moduleRequests(request);
  for (const value of Object.values(publicCopy)) expect(html).toContain(value);
  expect(html).toMatch(
    /<button[^>]*\bdisabled(?:=[^\s>]*)?[^>]*>[\s\S]*?Paste from Clipboard/,
  );
  expect(html).toMatch(/<link[^>]+rel=["']stylesheet["']/);
});

test("public pages remain styled, readable, and navigable without JavaScript", async ({
  browser,
  browserDiagnostics,
  request,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
    isMobile: info.project.use.isMobile,
    hasTouch: info.project.use.hasTouch,
  });
  const page = await context.newPage();
  try {
    await browserDiagnostics.monitor(page);
    await prepareBrowserPage(page);
    const { preloads } = await moduleRequests(request);
    for (const preload of preloads)
      browserDiagnostics.allowRequestFailure(preload, "csp");
    await page.goto("./");
    await visibleStaticPage(page);
    expect(
      await page
        .getByRole("button", { name: "Paste from Clipboard" })
        .isDisabled(),
    ).toBe(true);
    expect(
      await page.getByText(publicCopy.helper, { exact: true }).isVisible(),
    ).toBe(true);
    await assertStyledPublicNodes(page);
    await page.getByRole("link", { name: "About This Project" }).click();
    await expect(
      page.getByRole("heading", { name: "What the tool does" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Live tool" }).click();
    await visibleStaticPage(page);
  } finally {
    await context.close();
  }
});

test("blocked production modules leave the server-rendered state usable as progressive HTML", async ({
  page,
  browserDiagnostics,
  request,
}, info) => {
  const { srcs } = await moduleRequests(request);
  const blocked =
    info.project.use.browserName === "chromium"
      ? {
          console:
            "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector",
          request: "net::ERR_BLOCKED_BY_CLIENT.Inspector",
        }
      : {
          console: "Failed to load resource: Blocked by client",
          request: "Blocked by Web Inspector",
        };
  browserDiagnostics.allowConsoleError(blocked.console);
  for (const src of srcs) {
    browserDiagnostics.allowRequestFailure(src, blocked.request);
    await page.route(src, (route) => route.abort("blockedbyclient"));
  }
  await page.goto("./", { waitUntil: "commit" });
  await visibleStaticPage(page);
  await assertStyledPublicNodes(page);
  await expect(
    page.getByRole("button", { name: "Paste from Clipboard" }),
  ).toBeDisabled();
  await expect(
    page.getByText(publicCopy.helper, { exact: true }),
  ).toBeVisible();
});

test("delayed module hydration preserves public nodes, stored preferences, and first paste", async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("markdown-flavor", '"strict"');
    localStorage.setItem("remove-blank-lines", "false");
  });
  const { srcs } = await moduleRequests(request);
  let releaseModules!: () => void;
  const modulesReleased = new Promise<void>((resolve) => {
    releaseModules = resolve;
  });
  for (const src of srcs) {
    await page.route(src, async (route) => {
      await modulesReleased;
      await route.continue();
    });
  }
  let publicNodes: JSHandle | undefined;
  const release = () => releaseModules();
  try {
    await page.goto("./", { waitUntil: "commit" });
    await visibleStaticPage(page);
    await assertStyledPublicNodes(page);
    publicNodes = await page.evaluateHandle(() => {
      const findExact = (selector: string, text: string) =>
        [...document.querySelectorAll(selector)].find(
          (node) => node.textContent?.trim() === text,
        );
      const nodes = {
        heading: document.querySelector("h1"),
        description: findExact(
          "p",
          "Convert any HTML content into clean Markdown",
        ),
        ready: findExact("h2", "Ready to Convert"),
        attribution: document.querySelector('a[href="https://sinanbolel.com/"]')
          ?.parentElement,
        navigation: document.querySelector('a[href$="/about/"]'),
      };
      if (Object.values(nodes).some((node) => node == null))
        throw new Error("Expected public prerendered nodes are missing");
      return nodes;
    });
    release();
    await expect(
      page.getByRole("button", { name: "Paste from Clipboard" }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => ({
        flavor: localStorage.getItem("markdown-flavor"),
        spacing: localStorage.getItem("remove-blank-lines"),
      })),
    ).toEqual({ flavor: '"strict"', spacing: "false" });
    expect(
      await publicNodes.evaluate((nodes) =>
        Object.values(nodes).every((node) => node?.isConnected),
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        description: [...document.querySelectorAll("p")].filter(
          (node) =>
            node.textContent?.trim() ===
            "Convert any HTML content into clean Markdown",
        ).length,
        ready: [...document.querySelectorAll("h2")].filter(
          (node) => node.textContent?.trim() === "Ready to Convert",
        ).length,
        attribution: document.querySelectorAll(
          'a[href="https://sinanbolel.com/"]',
        ).length,
        navigation: document.querySelectorAll('a[href$="/about/"]').length,
      })),
    ).toEqual({
      h1: 1,
      description: 1,
      ready: 1,
      attribution: 1,
      navigation: 1,
    });
    await page.evaluate(({ html, text }) => {
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
    }, richClipboard);
    const editor = page.getByRole("textbox", { name: "Markdown Output" });
    await expect(editor).toHaveValue(/\* {3}First item/);
    expect(await editor.inputValue()).not.toContain(richClipboard.text);
    await expect(page.getByRole("combobox")).toContainText("Strict Markdown");
    await expect(
      page.getByRole("switch", { name: "Remove blank lines in lists" }),
    ).not.toBeChecked();
  } finally {
    release();
    await publicNodes?.dispose();
  }
});
