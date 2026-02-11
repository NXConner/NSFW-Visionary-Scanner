import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "../test-utils/fakeIndexedDB";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

const g = globalThis as unknown as Record<string, unknown> & { window?: unknown };
const w = (typeof window !== "undefined" ? window : undefined) as
  | (Window & typeof globalThis)
  | undefined;

// Ensure Storage APIs exist even if a suite runs in the Node environment.
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

if (typeof g.localStorage === "undefined") {
  Object.defineProperty(g, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}
if (typeof g.sessionStorage === "undefined") {
  Object.defineProperty(g, "sessionStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}

// Mock window.matchMedia (used by Radix/Tailwind + responsive logic)
if (w && typeof w.matchMedia !== "function") {
  Object.defineProperty(w, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}

  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;
if (w) {
  w.IntersectionObserver = MockIntersectionObserver;
}

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}

  observe(): void {}
  disconnect(): void {}
  unobserve(): void {}
}

globalThis.ResizeObserver = MockResizeObserver;
if (w) {
  w.ResizeObserver = MockResizeObserver;
}

// requestAnimationFrame is missing in some jsdom configurations; keep animations deterministic.
if (typeof g.requestAnimationFrame !== "function") {
  Object.defineProperty(g, "requestAnimationFrame", {
    value: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number,
    configurable: true,
  });
}
if (typeof g.cancelAnimationFrame !== "function") {
  Object.defineProperty(g, "cancelAnimationFrame", {
    value: (id: number) => clearTimeout(id as unknown as NodeJS.Timeout),
    configurable: true,
  });
}

if (w && w.HTMLElement && typeof w.HTMLElement.prototype.scrollIntoView !== "function") {
  w.HTMLElement.prototype.scrollIntoView = () => {};
}
