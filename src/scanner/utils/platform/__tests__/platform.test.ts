import { describe, it, expect, afterEach } from "vitest";
import { getPlatformKind } from "../platform";

describe("getPlatformKind", () => {
  const originalCapacitor = (window as any).Capacitor;

  afterEach(() => {
    (window as any).Capacitor = originalCapacitor;
  });

  it("returns web when Capacitor is not available", () => {
    (window as any).Capacitor = undefined;
    expect(getPlatformKind()).toBe("web");
  });

  it("returns capacitor when native platform is detected", () => {
    (window as any).Capacitor = { isNativePlatform: () => true };
    expect(getPlatformKind()).toBe("capacitor");
  });

  it("returns capacitor when Capacitor object exists", () => {
    (window as any).Capacitor = {};
    expect(getPlatformKind()).toBe("capacitor");
  });
});
