import { describe, expect, it } from "vitest";

/**
 * These tests intentionally do NOT talk to the network.
 * The primary contract is that importing the client never hard-crashes
 * when env variables are missing (e.g., in CI/unit tests).
 */
describe("supabase client", () => {
  it("imports without throwing when env is not configured", async () => {
    const mod = await import("@/integrations/supabase/client");
    expect(mod.supabase).toBeTruthy();
    expect(typeof mod.supabase.from).toBe("function");
    expect(typeof mod.supabase.functions.invoke).toBe("function");
  });
});
