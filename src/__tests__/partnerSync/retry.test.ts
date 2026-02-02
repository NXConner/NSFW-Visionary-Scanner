import { describe, it, expect, vi } from "vitest";
import { withRetry } from "@/lib/partnerSync";

describe("withRetry", () => {
  it("retries until success", async () => {
    const task = vi.fn();
    task.mockRejectedValueOnce(new Error("fail"));
    task.mockResolvedValueOnce("ok");

    const result = await withRetry(task, { retries: 2, baseDelayMs: 1 });
    expect(result).toBe("ok");
    expect(task).toHaveBeenCalledTimes(2);
  });
});
