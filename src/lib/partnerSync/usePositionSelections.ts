import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { getSexPositions } from "@/lib/nsfwAdvancedFeatures";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { subscribeToTable } from "./realtime";
import { sendPushNotification } from "@/lib/pushNotifications";
import { encryptData } from "@/lib/encryption";
import { getCachedValue, setCachedValue } from "./cache";
import { withRetry } from "./retry";
import { createTraceId } from "./trace";
import type {
  PartnerAvailabilityTag,
  PartnerBoundaryTag,
  PartnerPositionSelection,
  PositionIntensity,
  PositionSelectionStatus,
  ThoughtPingPriority,
} from "./types";
import type { SexPosition } from "@/lib/nsfwAdvancedFeatures";

type SuggestInput = {
  positionId?: string;
  customName?: string;
  customDescription?: string;
  themeTags: string[];
  intensity: PositionIntensity;
  note?: string;
  privateNote?: string;
  safetyChecklist?: string[];
  constraints?: Record<string, unknown>;
  availabilityTags?: PartnerAvailabilityTag[];
  boundaryTags?: PartnerBoundaryTag[];
  priority?: ThoughtPingPriority;
  privacyLevel?: "private" | "shared" | "public";
  swapGroupId?: string;
};

type UpdateSelectionInput = {
  status: PositionSelectionStatus;
  partnerNote?: string;
  successNotes?: string;
  successTags?: string[];
  rating?: number | null;
  tryLater?: boolean;
  favoriteTogether?: boolean;
};

export function usePositionSelections(
  connectionId: string | null,
  partnerId: string | null,
  pageSize: number = 20,
) {
  const [positions, setPositions] = useState<SexPosition[]>([]);
  const [selections, setSelections] = useState<PartnerPositionSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [connectionId]);

  const loadPositions = useCallback(async () => {
    const cached = getCachedValue<SexPosition[]>("positions_catalog");
    if (cached) setPositions(cached);
    try {
      setLoading(true);
      const list = await getSexPositions();
      setPositions(list);
      setCachedValue("positions_catalog", list, 1000 * 60 * 15);
    } catch (err) {
      logger.error("partner sync: load positions failed", { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSelections = useCallback(async () => {
    if (!connectionId) {
      setSelections([]);
      return;
    }
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      if (!user) return;

      const { data, error } = await fromExtended("partner_position_selections")
        .select("*, nsfw_positions_gallery(position_name, description)")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: false })
        .range(0, pageSize * (page + 1) - 1);

      if (error) {
        logger.error("partner sync: load selections failed", { error: error.message });
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        ...(row as PartnerPositionSelection),
        position_name: row.nsfw_positions_gallery?.position_name ?? null,
        position_description: row.nsfw_positions_gallery?.description ?? null,
      }));
      setSelections(mapped);
    } catch (err) {
      logger.error("partner sync: load selections failed", { error: err });
    } finally {
      setLoading(false);
    }
  }, [connectionId, page, pageSize]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    void loadSelections();
  }, [loadSelections]);

  useEffect(() => {
    if (!connectionId) return;
    const unsubscribe = subscribeToTable({
      table: "partner_position_selections",
      filter: `connection_id=eq.${connectionId}`,
      onChange: () => void loadSelections(),
    });
    return unsubscribe;
  }, [connectionId, loadSelections]);

  const loadMore = () => setPage(prev => prev + 1);

  const logPositionAction = useCallback(
    async (positionId: string | null, actionType: string) => {
      if (!connectionId || !currentUserId) return;
      await fromExtended("partner_position_activity_log").insert({
        connection_id: connectionId,
        user_id: currentUserId,
        position_id: positionId,
        action_type: actionType,
        created_at: new Date().toISOString(),
      });
    },
    [connectionId, currentUserId],
  );

  const suggest = useCallback(
    async (input: SuggestInput) => {
      if (!connectionId || !partnerId) {
        toast.error("Connect with a partner first");
        return false;
      }
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }

        if (!input.positionId && !input.customName?.trim()) {
          toast.error("Select a position or add a custom suggestion");
          return false;
        }

        const optimistic: PartnerPositionSelection = {
          id: `temp-${Date.now()}`,
          connection_id: connectionId,
          position_id: input.positionId ?? null,
          custom_position_name: input.customName?.trim() || null,
          custom_description: input.customDescription?.trim() || null,
          suggested_by: user.id,
          suggested_for: partnerId,
          selection_status: "pending",
          theme_tags: input.themeTags,
          intensity: input.intensity,
          note: input.note?.trim() || null,
          partner_note: null,
          responded_at: null,
          safety_checklist: input.safetyChecklist ?? [],
          constraints: input.constraints ?? {},
          availability_tags: input.availabilityTags ?? [],
          boundary_tags: input.boundaryTags ?? [],
          try_later: false,
          favorite_together: false,
          tried_at: null,
          success_notes: null,
          success_tags: null,
          swap_group_id: input.swapGroupId ?? null,
          priority: input.priority ?? "normal",
          privacy_level: input.privacyLevel ?? "private",
          rating: null,
          private_note_encrypted: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSelections(prev => [optimistic, ...prev]);

        const privateNoteEncrypted = input.privateNote
          ? await encryptData(input.privateNote)
          : null;

        const result = await withRetry(() =>
          fromExtended("partner_position_selections").insert({
            connection_id: connectionId,
            position_id: input.positionId ?? null,
            custom_position_name: input.customName?.trim() || null,
            custom_description: input.customDescription?.trim() || null,
            suggested_by: user.id,
            suggested_for: partnerId,
            selection_status: "pending",
            theme_tags: input.themeTags,
            intensity: input.intensity,
            note: input.note?.trim() || null,
            private_note_encrypted: privateNoteEncrypted,
            safety_checklist: input.safetyChecklist ?? [],
            constraints: input.constraints ?? {},
            availability_tags: input.availabilityTags ?? [],
            boundary_tags: input.boundaryTags ?? [],
            priority: input.priority ?? "normal",
            privacy_level: input.privacyLevel ?? "private",
            swap_group_id: input.swapGroupId ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        );

        const insertError = (result as { error?: { message: string } })?.error;
        if (insertError) {
          logger.error("partner sync: suggest position failed", { error: insertError.message });
          toast.error("Failed to suggest");
          return false;
        }

        const traceId = createTraceId("pos");
        await sendPushNotification(
          partnerId,
          "New position suggestion",
          input.customName ?? "New suggestion",
          { connectionId, traceId },
        );
        await logPositionAction(input.positionId ?? null, "suggested");
        toast.success("Suggestion sent");
        await loadSelections();
        return true;
      } catch (err) {
        logger.error("partner sync: suggest position failed", { error: err });
        toast.error("Failed to suggest");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [connectionId, loadSelections, logPositionAction, partnerId],
  );

  const updateSelection = useCallback(
    async (selectionId: string, payload: UpdateSelectionInput) => {
      try {
        setLoading(true);
        const isTried = payload.status === "tried";
        const { error } = await fromExtended("partner_position_selections")
          .update({
            selection_status: payload.status,
            partner_note: payload.partnerNote?.trim() || null,
            success_notes: payload.successNotes?.trim() || null,
            success_tags: payload.successTags ?? null,
            rating: payload.rating ?? null,
            try_later: payload.tryLater ?? false,
            favorite_together: payload.favoriteTogether ?? false,
            tried_at: isTried ? new Date().toISOString() : undefined,
            responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectionId);

        if (error) {
          logger.error("partner sync: update selection failed", { error: error.message });
          toast.error("Failed to update");
          return false;
        }
        await loadSelections();
        if (payload.status === "accepted") {
          await logPositionAction(
            selections.find(s => s.id === selectionId)?.position_id ?? null,
            "accepted",
          );
          const selection = selections.find(s => s.id === selectionId);
          if (selection) {
            const traceId = createTraceId("pos-accept");
            await sendPushNotification(
              selection.suggested_by,
              "Position accepted",
              selection.position_name ?? "Accepted",
              { selectionId, traceId },
            );
          }
        }
        if (payload.status === "declined") {
          await logPositionAction(
            selections.find(s => s.id === selectionId)?.position_id ?? null,
            "declined",
          );
          const selection = selections.find(s => s.id === selectionId);
          if (selection) {
            const traceId = createTraceId("pos-decline");
            await sendPushNotification(
              selection.suggested_by,
              "Position declined",
              selection.position_name ?? "Declined",
              { selectionId, traceId },
            );
          }
        }
        if (payload.status === "tried") {
          await logPositionAction(
            selections.find(s => s.id === selectionId)?.position_id ?? null,
            "tried",
          );
        }
        return true;
      } catch (err) {
        logger.error("partner sync: update selection failed", { error: err });
        toast.error("Failed to update");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadSelections, logPositionAction, selections],
  );

  const markTried = useCallback(
    async (selectionId: string, successNotes?: string, successTags?: string[]) => {
      const selection = selections.find(s => s.id === selectionId);
      const ok = await updateSelection(selectionId, {
        status: "tried",
        successNotes: successNotes ?? selection?.success_notes ?? "",
        successTags: successTags ?? selection?.success_tags ?? [],
      });
      return ok;
    },
    [selections, updateSelection],
  );

  const setTryLater = useCallback(
    async (selectionId: string, value: boolean) =>
      updateSelection(selectionId, { status: "pending", tryLater: value }),
    [updateSelection],
  );

  const setFavoriteTogether = useCallback(
    async (selectionId: string, value: boolean) =>
      updateSelection(selectionId, { status: "accepted", favoriteTogether: value }),
    [updateSelection],
  );

  const proposeSwap = useCallback(
    async (selectionId: string, positionId: string) => {
      const selection = selections.find(s => s.id === selectionId);
      if (!selection) return false;
      return suggest({
        positionId,
        themeTags: selection.theme_tags,
        intensity: selection.intensity,
        note: "Swap proposal",
        swapGroupId: selection.id,
      });
    },
    [selections, suggest],
  );

  const mutualSelections = useMemo(
    () => selections.filter(s => s.selection_status === "accepted"),
    [selections],
  );

  const pendingForMe = useMemo(
    () => selections.filter(s => s.selection_status === "pending" && s.suggested_for === currentUserId),
    [selections, currentUserId],
  );

  const pendingFromMe = useMemo(
    () => selections.filter(s => s.selection_status === "pending" && s.suggested_by === currentUserId),
    [selections, currentUserId],
  );

  return {
    positions,
    selections,
    mutualSelections,
    pendingForMe,
    pendingFromMe,
    loading,
    currentUserId,
    loadMore,
    reloadSelections: loadSelections,
    reloadPositions: loadPositions,
    suggest,
    updateSelection,
    markTried,
    proposeSwap,
    setTryLater,
    setFavoriteTogether,
  };
}
