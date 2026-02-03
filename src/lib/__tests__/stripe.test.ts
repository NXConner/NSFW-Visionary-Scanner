import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubscriptionManager } from "../stripe";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("SubscriptionManager", () => {
  const invoke = vi.mocked(supabase.functions.invoke);

  beforeEach(() => {
    invoke.mockReset();
  });

  it("creates a subscription via edge function", async () => {
    invoke.mockResolvedValue({ data: { subscriptionId: "sub_123" }, error: null });
    const manager = new SubscriptionManager();
    const result = await manager.createSubscription("pro", "pm_123");

    expect(result?.subscriptionId).toBe("sub_123");
    expect(invoke).toHaveBeenCalledWith("create-subscription", {
      body: { planId: "pro", paymentMethodId: "pm_123" },
    });
  });

  it("returns false on cancel when edge returns error", async () => {
    invoke.mockResolvedValue({ data: null, error: { message: "fail" } });
    const manager = new SubscriptionManager();
    const result = await manager.cancelSubscription("sub_123", true);

    expect(result).toBe(false);
  });
});
