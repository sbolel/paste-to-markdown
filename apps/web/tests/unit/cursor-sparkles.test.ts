import { act, createElement, type HTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CursorSparkles } from "../../src/components/CursorSparkles";

// Test particle lifetimes independently of animation scheduling. Production
// browser tests below exercise the real Motion components and DOM detachment.
vi.mock("framer-motion", () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement>) =>
      createElement(
        "div",
        { className: props.className, style: props.style },
        props.children,
      ),
  },
}));

let root: Root | null;
let media: MediaQueryList;
let mediaEvents: EventTarget;
let matches: boolean;

function mount() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(createElement(CursorSparkles)));
}

function nodes() {
  return Array.from(
    document.querySelectorAll('[data-testid="cursor-sparkles"] > div'),
  );
}

function move() {
  act(() =>
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 100, clientY: 100 }),
    ),
  );
}

function advance(ms: number) {
  act(() => vi.advanceTimersByTime(ms));
  // React commits after a fake-clock jump; flush any expiry now due at that time.
  act(() => vi.advanceTimersByTime(0));
}

function setEligibility(value: boolean) {
  matches = value;
  act(() => mediaEvents.dispatchEvent(new Event("change")));
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  matches = true;
  mediaEvents = new EventTarget();
  media = {
    get matches() {
      return matches;
    },
    media: "",
    onchange: null,
    addEventListener: vi.fn(mediaEvents.addEventListener.bind(mediaEvents)),
    removeEventListener: vi.fn(
      mediaEvents.removeEventListener.bind(mediaEvents),
    ),
  } as unknown as MediaQueryList;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => media),
  );
  vi.spyOn(Math, "random").mockReturnValue(0.75);
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("cursor particle lifetime", () => {
  it("removes the entire finished batch and stops scheduling cleanup", () => {
    mount();
    move();
    const emitted = nodes();
    expect(emitted).toHaveLength(3);
    advance(1599);
    expect(nodes()).toHaveLength(3);
    advance(1);
    expect(nodes()).toHaveLength(0);
    expect(emitted.every((node) => !node.isConnected)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps fixed deadlines for older particles while preserving younger batches", () => {
    mount();
    move();
    const first = nodes();
    advance(800);
    move();
    const second = nodes().slice(3);
    expect(vi.getTimerCount()).toBe(1);
    advance(800);
    expect(first.every((node) => !node.isConnected)).toBe(true);
    expect(second.every((node) => node.isConnected)).toBe(true);
    expect(nodes()).toHaveLength(3);
    advance(800);
    expect(nodes()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps at most 100 actual nodes during sustained movement and expires them after it stops", () => {
    mount();
    for (let i = 0; i < 140; i++) {
      move();
      expect(nodes().length).toBeLessThanOrEqual(100);
      expect(vi.getTimerCount()).toBe(1);
      advance(16);
    }
    expect(nodes()).toHaveLength(100);
    const remaining = nodes();
    advance(1600);
    expect(nodes()).toHaveLength(0);
    expect(remaining.every((node) => !node.isConnected)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("clears particles and listeners when eligibility changes and restarts empty", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    mount();
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    move();
    const emitted = nodes();
    setEligibility(false);
    expect(
      document.querySelector('[data-testid="cursor-sparkles"]'),
    ).toBeNull();
    expect(emitted.every((node) => !node.isConnected)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    move();
    expect(vi.getTimerCount()).toBe(0);
    setEligibility(true);
    expect(nodes()).toHaveLength(0);
    move();
    expect(nodes()).toHaveLength(3);
    setEligibility(false);
    for (const event of ["mousemove", "resize"]) {
      const registrations = add.mock.calls.filter(([type]) => type === event);
      expect(registrations).toHaveLength(2);
      for (const registration of registrations)
        expect(remove).toHaveBeenCalledWith(...registration);
    }
  });

  it("registers no particle work while initially ineligible and cleans up fully on unmount", () => {
    matches = false;
    mount();
    move();
    expect(nodes()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    setEligibility(true);
    move();
    expect(nodes()).toHaveLength(3);
    act(() => root!.unmount());
    root = null;
    expect(vi.getTimerCount()).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalledWith(
      "change",
      vi.mocked(media.addEventListener).mock.calls[0][1],
    );
    move();
    expect(vi.getTimerCount()).toBe(0);
  });
});
