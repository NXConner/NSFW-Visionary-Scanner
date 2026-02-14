import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";

import { adminListLicenses, adminGenerateLicense } from "../api";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("admin licenses api", () => {
  const invoke = vi.mocked(supabase.functions.invoke);

  beforeEach(() => {
    invoke.mockReset();
  });

  it("lists licenses via edge function", async () => {
    invoke.mockResolvedValue({
      data: {
        licenses: [
          {
            id: "lic_1",
            key: "ABCD-EFGH-IJKL-MNOP",
            userId: "u1",
            userEmail: "user@example.com",
            packageId: "dlc-positions",
            packageName: "Positions",
            status: "active",
            devices: 1,
            maxDevices: 3,
            createdAtIso: "2026-02-14T00:00:00.000Z",
            expiresAtIso: null,
          },
        ],
      },
      error: null,
    } as any);

    const res = await adminListLicenses({ limit: 10, includeInactive: true });
    expect(invoke).toHaveBeenCalledWith("admin-licenses", {
      body: { action: "list", limit: 10, includeInactive: true },
    });
    expect(res).toHaveLength(1);
    expect(res[0].key).toContain("-");
    expect(res[0].status).toBe("active");
  });

  it("generates a license via edge function", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null } as any);

    await adminGenerateLicense({
      userEmail: "user@example.com",
      packageId: "dlc-positions",
      licenseType: "one_time",
      maxDevices: 3,
      expiresAtIso: null,
      note: "manual issue",
    });

    expect(invoke).toHaveBeenCalledWith("admin-licenses", {
      body: {
        action: "generate",
        userEmail: "user@example.com",
        packageId: "dlc-positions",
        licenseType: "one_time",
        maxDevices: 3,
        expiresAtIso: null,
        note: "manual issue",
      },
    });
  });
});
