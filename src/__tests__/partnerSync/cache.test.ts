import { describe, it, expect } from "vitest";
import { getCachedValue, setCachedValue } from "@/lib/partnerSync";

describe("cache helpers", () => {
  it("stores and retrieves cached values", () => {
    setCachedValue("test-key", { ok: true }, 1000);
    const value = getCachedValue<{ ok: boolean }>("test-key");
    expect(value?.ok).toBe(true);
  });
});
