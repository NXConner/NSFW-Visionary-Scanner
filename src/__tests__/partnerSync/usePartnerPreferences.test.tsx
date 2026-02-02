import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePartnerPreferences } from "@/lib/partnerSync/usePartnerPreferences";

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

vi.mock("@/lib/supabaseExtensions", () => ({
  fromExtended: () => ({
    select: mockSelect,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
    insert: mockInsert,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("usePartnerPreferences", () => {
  beforeEach(() => {
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
  });

  it("loads existing preferences", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: {
        user_id: "user-1",
        quiet_hours_enabled: true,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00",
        timezone: "UTC",
        rate_limit_per_hour: 10,
        allow_push_notifications: true,
        allow_scheduled_pings: true,
        allow_media: true,
        created_at: "now",
        updated_at: "now",
      },
      error: null,
    });

    const { result } = renderHook(() => usePartnerPreferences());
    await waitFor(() => expect(result.current.preferences?.user_id).toBe("user-1"));
  });
});
