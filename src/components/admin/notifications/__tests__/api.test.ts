import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";

import {
  adminListBroadcastNotifications,
  adminSaveBroadcastDraft,
  adminSendBroadcastNow,
} from "../api";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("admin broadcast notifications api", () => {
  const invoke = vi.mocked(supabase.functions.invoke);

  beforeEach(() => {
    invoke.mockReset();
  });

  it("lists notifications via edge function", async () => {
    invoke.mockResolvedValue({
      data: {
        notifications: [
          {
            id: "n1",
            created_by: "u1",
            title: "Hello",
            message: "World",
            type: "info",
            audience: "all",
            audience_user_ids: [],
            channels: { in_app: true, push: false, email: false },
            status: "sent",
            scheduled_for: null,
            sent_at: "2026-02-14T00:00:00.000Z",
            target_count: 10,
            read_count: 3,
            last_error: null,
            is_deleted: false,
            deleted_at: null,
            created_at: "2026-02-14T00:00:00.000Z",
            updated_at: "2026-02-14T00:00:00.000Z",
            metadata: {},
          },
        ],
        stats: { totalUsers: 123, totalTokens: 55 },
      },
      error: null,
    } as any);

    const res = await adminListBroadcastNotifications({ limit: 10, includeDeleted: false });

    expect(invoke).toHaveBeenCalledWith("admin-notifications", {
      body: { action: "list", limit: 10, includeDeleted: false },
    });
    expect(res.notifications).toHaveLength(1);
    expect(res.notifications[0].id).toBe("n1");
    expect(res.notifications[0].channels.inApp).toBe(true);
    expect(res.stats.totalUsers).toBe(123);
  });

  it("saves a draft via edge function", async () => {
    invoke.mockResolvedValue({
      data: {
        notification: {
          id: "n2",
          created_by: "u1",
          title: "Draft",
          message: "Body",
          type: "warning",
          audience: "premium",
          audience_user_ids: [],
          channels: { in_app: true, push: true, email: false },
          status: "draft",
          scheduled_for: null,
          sent_at: null,
          target_count: 0,
          read_count: 0,
          last_error: null,
          is_deleted: false,
          deleted_at: null,
          created_at: "2026-02-14T00:00:00.000Z",
          updated_at: "2026-02-14T00:00:00.000Z",
          metadata: {},
        },
      },
      error: null,
    } as any);

    const draft = await adminSaveBroadcastDraft({
      title: "Draft",
      message: "Body",
      type: "warning",
      audience: "premium",
      channels: { inApp: true, push: true, email: false },
      audienceUserIds: [],
    });

    expect(invoke).toHaveBeenCalledWith("admin-notifications", {
      body: {
        action: "save_draft",
        notification: {
          title: "Draft",
          message: "Body",
          type: "warning",
          audience: "premium",
          channels: { inApp: true, push: true, email: false },
          audienceUserIds: [],
        },
      },
    });
    expect(draft.status).toBe("draft");
    expect(draft.channels.push).toBe(true);
  });

  it("sends now with dryRun flag", async () => {
    invoke.mockResolvedValue({
      data: {
        notification: {
          id: "dry-run",
          created_by: "u1",
          title: "Now",
          message: "Msg",
          type: "success",
          audience: "specific",
          audience_user_ids: ["u2"],
          channels: { in_app: true, push: false, email: false },
          status: "sent",
          scheduled_for: null,
          sent_at: "2026-02-14T00:00:00.000Z",
          target_count: 1,
          read_count: 0,
          last_error: null,
          is_deleted: false,
          deleted_at: null,
          created_at: "2026-02-14T00:00:00.000Z",
          updated_at: "2026-02-14T00:00:00.000Z",
          metadata: {},
        },
        targetCount: 1,
        delivery: { in_app: { attempted: true } },
        lastError: null,
        recipients: { users: 1, capped: false },
      },
      error: null,
    } as any);

    const res = await adminSendBroadcastNow({
      title: "Now",
      message: "Msg",
      type: "success",
      audience: "specific",
      audienceUserIds: ["u2"],
      channels: { inApp: true, push: false, email: false },
      dryRun: true,
    });

    expect(invoke).toHaveBeenCalledWith("admin-notifications", {
      body: {
        action: "send_now",
        notification: {
          title: "Now",
          message: "Msg",
          type: "success",
          audience: "specific",
          audienceUserIds: ["u2"],
          channels: { inApp: true, push: false, email: false },
          dryRun: true,
        },
        dryRun: true,
      },
    });
    expect(res.notification.id).toBe("dry-run");
    expect(res.targetCount).toBe(1);
  });
});
