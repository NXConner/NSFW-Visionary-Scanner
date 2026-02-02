import { describe, expect, it, beforeEach, vi } from "vitest";

import {
  clearFeatureFlagOverride,
  getFeatureFlagOverride,
  getFeatureFlagOverrides,
  setFeatureFlagOverride,
} from "@/lib/featureFlags";

const KEY = "morphoscan_feature_flag_overrides";

describe("feature flag overrides", () => {
  beforeEach(() => {
    window.localStorage.removeItem(KEY);
  });

  it("returns empty overrides when none exist", () => {
    expect(getFeatureFlagOverrides()).toEqual({});
    expect(getFeatureFlagOverride("x")).toBeUndefined();
  });

  it("stores and reads boolean overrides", () => {
    setFeatureFlagOverride("foo", true);
    setFeatureFlagOverride("bar", false);
    expect(getFeatureFlagOverride("foo")).toBe(true);
    expect(getFeatureFlagOverride("bar")).toBe(false);
    expect(getFeatureFlagOverrides()).toEqual({ foo: true, bar: false });
  });

  it("filters invalid override payloads", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ ok: true, nope: "x", num: 1, nil: null }));
    expect(getFeatureFlagOverrides()).toEqual({ ok: true });
  });

  it("ignores invalid JSON", () => {
    window.localStorage.setItem(KEY, "{not-json");
    expect(getFeatureFlagOverrides()).toEqual({});
  });

  it("clears overrides and emits an event on change", () => {
    const spy = vi.fn();
    window.addEventListener("feature-flag-overrides-changed", spy);

    setFeatureFlagOverride("foo", true);
    expect(spy).toHaveBeenCalledTimes(1);
    clearFeatureFlagOverride("foo");
    expect(getFeatureFlagOverride("foo")).toBeUndefined();
    expect(spy).toHaveBeenCalledTimes(2);

    window.removeEventListener("feature-flag-overrides-changed", spy);
  });
});
