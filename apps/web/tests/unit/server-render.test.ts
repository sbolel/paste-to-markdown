// @vitest-environment node
import { expect, it, vi } from "vitest";
import { render } from "../../src/entry-server";
import { sanitizedPreview } from "../../src/lib/markdown";

vi.mock("../../src/lib/markdown", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/lib/markdown")>();
  return {
    ...actual,
    sanitizedPreview: vi.fn(() => {
      throw new Error("Browser sanitizer ran during prerender");
    }),
  };
});

it("renders the shared application repeatedly without browser globals or preview processing", () => {
  expect(typeof window).toBe("undefined");
  expect(typeof document).toBe("undefined");
  const first = render();
  expect(render()).toBe(first);
  expect(first).toContain("Paste to Markdown");
  expect(first).toContain("Ready to Convert");
  expect(first).toContain("About This Project");
  expect(first).toContain("Built by");
  expect(first).toContain("disabled");
  expect(sanitizedPreview).not.toHaveBeenCalled();
});
