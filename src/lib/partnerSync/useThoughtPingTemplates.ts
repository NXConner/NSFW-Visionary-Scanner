import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { ThoughtPingTemplate, QuickReplyTemplate } from "./types";

export function useThoughtPingTemplates() {
  const [templates, setTemplates] = useState<ThoughtPingTemplate[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReplyTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: templateRows, error: templateError }, { data: replyRows, error: replyError }] =
        await Promise.all([
          fromExtended("partner_thought_ping_templates")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
          fromExtended("partner_quick_reply_templates")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false }),
        ]);

      if (templateError) {
        logger.error("partner sync: load templates failed", { error: templateError.message });
      } else {
        setTemplates((templateRows || []) as ThoughtPingTemplate[]);
      }

      if (replyError) {
        logger.error("partner sync: load quick replies failed", { error: replyError.message });
      } else {
        setQuickReplies((replyRows || []) as QuickReplyTemplate[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createTemplate = useCallback(
    async (payload: Partial<ThoughtPingTemplate>) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }
        const { error } = await fromExtended("partner_thought_ping_templates").insert({
          user_id: user.id,
          title: payload.title ?? "New template",
          message: payload.message ?? "",
          detailed_message: payload.detailed_message ?? null,
          tone_tags: payload.tone_tags ?? [],
          intensity: payload.intensity ?? "medium",
          theme: payload.theme ?? null,
          is_favorite: payload.is_favorite ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) {
          toast.error("Failed to save template");
          return false;
        }
        await load();
        return true;
      } catch (error) {
        logger.error("partner sync: create template failed", { error });
        return false;
      }
    },
    [load],
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      try {
        const { error } = await fromExtended("partner_thought_ping_templates")
          .delete()
          .eq("id", templateId);
        if (error) {
          toast.error("Failed to delete template");
          return false;
        }
        await load();
        return true;
      } catch (error) {
        logger.error("partner sync: delete template failed", { error });
        return false;
      }
    },
    [load],
  );

  const createQuickReply = useCallback(
    async (payload: Partial<QuickReplyTemplate>) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }
        const { error } = await fromExtended("partner_quick_reply_templates").insert({
          user_id: user.id,
          label: payload.label ?? "Quick reply",
          message: payload.message ?? "",
          is_favorite: payload.is_favorite ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) {
          toast.error("Failed to save quick reply");
          return false;
        }
        await load();
        return true;
      } catch (error) {
        logger.error("partner sync: create quick reply failed", { error });
        return false;
      }
    },
    [load],
  );

  const deleteQuickReply = useCallback(
    async (replyId: string) => {
      try {
        const { error } = await fromExtended("partner_quick_reply_templates")
          .delete()
          .eq("id", replyId);
        if (error) {
          toast.error("Failed to delete quick reply");
          return false;
        }
        await load();
        return true;
      } catch (error) {
        logger.error("partner sync: delete quick reply failed", { error });
        return false;
      }
    },
    [load],
  );

  return {
    templates,
    quickReplies,
    loading,
    reload: load,
    createTemplate,
    deleteTemplate,
    createQuickReply,
    deleteQuickReply,
  };
}
