import { test, expect } from "./fixtures";

test("normal-motion particles detach as a batch after movement stops", async ({
  app,
  page,
}, info) => {
  test.skip(
    info.project.name === "chromium-mobile",
    "Particles require a desktop fine pointer",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await app.open();
  await page.mouse.move(100, 100);
  await page.mouse.move(400, 300, { steps: 20 });
  const particles = page.getByTestId("cursor-sparkles").locator(":scope > div");
  await expect.poll(() => particles.count()).toBeGreaterThan(0);
  const emitted = await page
    .getByTestId("cursor-sparkles")
    .evaluateHandle((container) => Array.from(container.children));
  try {
    expect(await emitted.evaluate((nodes) => nodes.length)).toBeGreaterThan(0);
    // Sample the captured nodes in one browser call. A growing polling interval
    // can otherwise skip from before 1,600ms to beyond the 2,200ms deadline.
    await expect
      .poll(
        () =>
          emitted.evaluate((nodes) => nodes.every((node) => !node.isConnected)),
        { timeout: 2200, intervals: [50] },
      )
      .toBe(true);
    await expect(particles).toHaveCount(0);
  } finally {
    await emitted.dispose();
  }
});

test("particles react to runtime reduced-motion and viewport changes", async ({
  app,
  page,
}, info) => {
  test.skip(
    info.project.name === "chromium-mobile",
    "Particles require a desktop fine pointer",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await app.open();
  const container = page.getByTestId("cursor-sparkles");
  await page.mouse.move(120, 120);
  await expect
    .poll(() => container.locator(":scope > div").count())
    .toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(container).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(container).toHaveCount(1);
  await expect(container.locator(":scope > div")).toHaveCount(0);
  await page.mouse.move(240, 240);
  await expect
    .poll(() => container.locator(":scope > div").count())
    .toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(container).toHaveCount(0);
  await page.setViewportSize({ width: 1550, height: 964 });
  await expect(container).toHaveCount(1);
  await expect(container.locator(":scope > div")).toHaveCount(0);
});
