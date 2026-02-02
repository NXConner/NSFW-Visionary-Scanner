import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import {
  getIntimateDateProposals,
  respondToProposal,
  type IntimateDateProposal,
  type ProposalModifications,
} from "@/lib/nsfwAdvancedFeatures";
import type {
  DateNightChecklistItem,
  DateNightPackingItem,
  DateNightPlanDetails,
  DateNightPlanInput,
  DateNightReminderItem,
  DateNightTemplate,
} from "./types";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { sendPushNotification } from "@/lib/pushNotifications";
import { createTraceId } from "./trace";
import { withRetry } from "./retry";
import { subscribeToTable } from "./realtime";
import { getCachedValue, setCachedValue } from "./cache";

type ProposalDetails = DateNightPlanDetails;

function buildActivitiesPayload(input: DateNightPlanInput) {
  return {
    segments: input.segments,
    theme: input.theme || null,
    distractions: input.distractionTags,
    itinerary: input.itinerary.map(item => ({
      segment: item.segment,
      title: item.title,
      time: item.time,
      location: item.location,
      notes: item.notes,
    })),
    positions: input.positions,
    budget: input.budget,
    travel_minutes: input.travelMinutes,
    checklist: input.checklist.map(item => item.item),
    packing_list: input.packingList.map(item => item.item),
    aftercare: input.aftercare.map(item => item.item),
    reminders: input.reminders.map(item => ({
      reminderType: item.reminderType,
      remindAt: item.remindAt,
      notes: item.notes,
    })),
  };
}

function mapTemplateCategory(
  theme: DateNightPlanInput["theme"],
): DateNightTemplate["template_category"] {
  const normalized = String(theme || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "custom";
  if (normalized.includes("romantic") || normalized.includes("sensual") || normalized.includes("making love")) {
    return "romantic";
  }
  if (
    normalized.includes("kinky") ||
    normalized.includes("bdsm") ||
    normalized.includes("bondage") ||
    normalized.includes("dominant") ||
    normalized.includes("submissive") ||
    normalized.includes("rough") ||
    normalized.includes("hardcore") ||
    normalized.includes("primal") ||
    normalized.includes("taboo")
  ) {
    return "kinky";
  }
  if (
    normalized.includes("adventurous") ||
    normalized.includes("experimental") ||
    normalized.includes("outdoor") ||
    normalized.includes("fantasy") ||
    normalized.includes("roleplay")
  ) {
    return "adventurous";
  }
  if (normalized.includes("quick")) return "quick";
  if (normalized.includes("slow") || normalized.includes("all night") || normalized.includes("passion")) {
    return "passionate";
  }
  return "custom";
}

function buildReminderPayload(reminders: DateNightReminderItem[]) {
  return reminders.map(item => ({
    reminderType: item.reminderType,
    remindAt: item.remindAt,
    notes: item.notes,
  }));
}

export function useDateNights(partnerId: string | null, pageSize: number = 10) {
  const [proposals, setProposals] = useState<IntimateDateProposal[]>([]);
  const [details, setDetails] = useState<Record<string, ProposalDetails>>({});
  const [templates, setTemplates] = useState<DateNightTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [partnerId]);

  const loadTemplates = useCallback(async () => {
    const cached = getCachedValue<DateNightTemplate[]>("date_templates");
    if (cached) setTemplates(cached);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const query = fromExtended("intimate_date_templates").select("*");
      if (user?.id) {
        query.or(`is_public.eq.true,user_id.eq.${user.id}`);
      } else {
        query.eq("is_public", true);
      }
      const { data, error } = await query
        .order("is_public", { ascending: false })
        .order("usage_count", { ascending: false });
      if (error) {
        logger.warn("partner sync: failed to load date templates", { error: error.message });
        return;
      }
      const rows = (data || []) as DateNightTemplate[];
      setTemplates(rows);
      setCachedValue("date_templates", rows, 5 * 60 * 1000); // 5 min TTL
    } catch (err) {
      logger.warn("partner sync: load date templates failed", { error: err });
    }
  }, []);

  const loadDetails = useCallback(async (proposalIds: string[]) => {
    if (proposalIds.length === 0) {
      setDetails({});
      return;
    }
    const [itinerary, checklist, packing, distractions, positions, aftercare, reminders, reflections] =
      await Promise.all([
        fromExtended("intimate_date_itinerary_items")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_checklist_items")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_packing_items")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_distractions")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_positions")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_aftercare_items")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_reminders")
          .select("*")
          .in("proposal_id", proposalIds),
        fromExtended("intimate_date_reflections")
          .select("*")
          .in("proposal_id", proposalIds),
      ]);

    const next: Record<string, ProposalDetails> = {};
    for (const id of proposalIds) {
      next[id] = {
        itinerary: (itinerary.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => ({
            id: item.id,
            segment: item.segment,
            title: item.title,
            time: item.time ?? "",
            location: item.location ?? "",
            notes: item.notes ?? "",
          })),
        checklist: (checklist.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => ({
            id: item.id,
            item: item.item,
            category: item.category,
            isRequired: item.is_required,
          })),
        packingList: (packing.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => ({ id: item.id, item: item.item })),
        distractions: (distractions.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => item.label),
        positions: (positions.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => item.position_label),
        aftercare: (aftercare.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => ({
            id: item.id,
            item: item.item,
            category: "aftercare",
            isRequired: true,
          })),
        reminders: (reminders.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => ({
            id: item.id,
            reminderType: item.reminder_type,
            remindAt: item.remind_at,
            notes: item.notes ?? "",
          })),
        reflections: (reflections.data || [])
          .filter(i => i.proposal_id === id)
          .map(item => ({
            rating: item.rating,
            notes: item.notes ?? "",
            userId: item.user_id,
          })),
      };
    }
    setDetails(next);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getIntimateDateProposals();
      if (!partnerId) {
        setProposals(list);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProposals([]);
        return;
      }
      const filtered = list.filter(
        p =>
          (p.creator_id === user.id && p.partner_id === partnerId) ||
          (p.creator_id === partnerId && p.partner_id === user.id),
      );
      setProposals(filtered.slice(0, pageSize * (page + 1)));
      await loadDetails(filtered.map(p => p.id));
    } catch (err) {
      logger.error("partner sync: load date nights failed", { error: err });
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [loadDetails, page, pageSize, partnerId]);

  useEffect(() => {
    void load();
    void loadTemplates();
  }, [load, loadTemplates]);

  useEffect(() => {
    if (!partnerId) return;
    const unsubscribe = subscribeToTable({
      table: "intimate_date_proposals",
      onChange: () => void load(),
    });
    return unsubscribe;
  }, [load, partnerId]);

  const loadMore = () => setPage(prev => prev + 1);

  const persistDetails = useCallback(
    async (proposalId: string, userId: string, input: DateNightPlanInput) => {
      const itineraryRows = input.itinerary.map((item, index) => ({
        proposal_id: proposalId,
        created_by: userId,
        segment: item.segment,
        title: item.title,
        time: item.time,
        location: item.location,
        notes: item.notes,
        order_index: index,
      }));
      const checklistRows = input.checklist.map((item, index) => ({
        proposal_id: proposalId,
        created_by: userId,
        item: item.item,
        category: item.category || "prep",
        is_required: item.isRequired ?? true,
        order_index: index,
      }));
      const packingRows = input.packingList.map((item, index) => ({
        proposal_id: proposalId,
        created_by: userId,
        item: item.item,
        order_index: index,
      }));
      const distractionRows = input.distractionTags.map(label => ({
        proposal_id: proposalId,
        created_by: userId,
        label,
      }));
      const positionRows = input.positions
        .map(positionLabel => positionLabel?.trim())
        .filter(Boolean)
        .map(positionLabel => ({
          proposal_id: proposalId,
          created_by: userId,
          position_label: positionLabel,
        }));
      const reminderRows = input.reminders
        .filter(reminder => reminder.remindAt)
        .map(reminder => ({
          proposal_id: proposalId,
          created_by: userId,
          reminder_type: reminder.reminderType,
          remind_at: reminder.remindAt,
          notes: reminder.notes || null,
        }));
      const aftercareRows = input.aftercare.map((item, index) => ({
        proposal_id: proposalId,
        created_by: userId,
        item: item.item,
        order_index: index,
      }));

      await Promise.all([
        itineraryRows.length > 0
          ? fromExtended("intimate_date_itinerary_items").insert(itineraryRows)
          : Promise.resolve(),
        checklistRows.length > 0
          ? fromExtended("intimate_date_checklist_items").insert(checklistRows)
          : Promise.resolve(),
        packingRows.length > 0
          ? fromExtended("intimate_date_packing_items").insert(packingRows)
          : Promise.resolve(),
        distractionRows.length > 0
          ? fromExtended("intimate_date_distractions").insert(distractionRows)
          : Promise.resolve(),
        positionRows.length > 0
          ? fromExtended("intimate_date_positions").insert(positionRows)
          : Promise.resolve(),
        reminderRows.length > 0
          ? fromExtended("intimate_date_reminders").insert(reminderRows)
          : Promise.resolve(),
        aftercareRows.length > 0
          ? fromExtended("intimate_date_aftercare_items").insert(aftercareRows)
          : Promise.resolve(),
      ]);
    },
    [],
  );

  const createPlan = useCallback(
    async (input: DateNightPlanInput) => {
      if (!partnerId) {
        toast.error("Connect with a partner first");
        return null;
      }
      if (!input.title.trim() || !input.date || !input.time) {
        toast.error("Title, date, and time are required");
        return null;
      }

      try {
        setLoading(true);
        const activities = buildActivitiesPayload(input);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return null;
        }
        // Direct table insert instead of RPC (RPC not available)
        let proposalId: string | null = null;
        {
          const { data, error } = await fromExtended("intimate_date_proposals")
            .insert({
              creator_id: user.id,
              partner_id: partnerId,
              proposal_title: input.title,
              proposed_date: input.date,
              proposed_time: input.time,
              location_name: input.locationName || null,
              location_address: input.locationAddress || null,
              location_type: input.locationType,
              is_location_private: input.isLocationPrivate,
              duration_minutes: input.durationMinutes ?? null,
              activities,
              positions: input.positions,
              text_message: input.message || null,
              special_requests: input.specialRequests || null,
              status: "pending",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          if (error) {
            toast.error(error.message || "Failed to create plan");
            return null;
          }
          proposalId = data?.id as string;
          await persistDetails(proposalId, user.id, input);
        }

        const traceId = createTraceId("date");
        await sendPushNotification(partnerId, "New date plan", input.title, {
          proposalId,
          traceId,
        });
        toast.success("Date night plan sent");
        await load();
        return proposalId;
      } catch (err) {
        logger.error("partner sync: create date night failed", { error: err });
        toast.error("Failed to create plan");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [load, partnerId, persistDetails],
  );

  const saveTemplate = useCallback(
    async (input: DateNightPlanInput, templateName: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please sign in");
          return false;
        }

        const activities = buildActivitiesPayload(input);
        const { error } = await fromExtended("intimate_date_templates").insert({
          user_id: user.id,
          template_name: templateName,
          template_category: mapTemplateCategory(input.theme),
          is_public: false,
          default_activities: activities,
          default_positions: input.positions,
          default_duration_minutes: input.durationMinutes ?? null,
          default_location_type: input.locationType,
          default_message: input.message || null,
          default_voice_script: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          toast.error(error.message || "Failed to save template");
          return false;
        }

        toast.success("Template saved");
        await loadTemplates();
        return true;
      } catch (err) {
        logger.error("partner sync: save date template failed", { error: err });
        toast.error("Failed to save template");
        return false;
      }
    },
    [loadTemplates],
  );

  const respond = useCallback(
    async (proposalId: string, response: "accepted" | "declined") => {
      try {
        setLoading(true);
        const ok = await respondToProposal(proposalId, response);
        if (ok) {
          const proposal = proposals.find(p => p.id === proposalId);
          if (proposal) {
            const traceId = createTraceId("date-response");
            await sendPushNotification(
              proposal.creator_id,
              "Date plan response",
              `${proposal.proposal_title} was ${response}`,
              { proposalId, traceId },
            );
          }
          await load();
        }
        return ok;
      } catch (err) {
        logger.error("partner sync: respond to plan failed", { error: err });
        toast.error("Failed to respond");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load, proposals],
  );

  const addReflection = useCallback(async (proposalId: string, rating: number, notes: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { error } = await fromExtended("intimate_date_reflections").insert({
        proposal_id: proposalId,
        user_id: user.id,
        rating,
        notes,
        created_at: new Date().toISOString(),
      });
      if (error) {
        toast.error("Failed to save reflection");
        return false;
      }
      await load();
      return true;
    } catch (error) {
      logger.error("partner sync: add reflection failed", { error });
      return false;
    }
  }, [load]);

  const respondWithModification = useCallback(
    async (proposalId: string, modifications: ProposalModifications) => {
      try {
        setLoading(true);
        const ok = await respondToProposal(proposalId, "modified", modifications);
        if (ok) {
          const proposal = proposals.find(p => p.id === proposalId);
          if (proposal) {
            const traceId = createTraceId("date-modify");
            await sendPushNotification(
              proposal.creator_id,
              "Date plan update",
              `${proposal.proposal_title} has suggested changes`,
              { proposalId, traceId },
            );
          }
          await load();
        }
        return ok;
      } catch (err) {
        logger.error("partner sync: modify plan failed", { error: err });
        toast.error("Failed to propose changes");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [load, proposals],
  );

  const clonePlan = useCallback(
    async (proposal: IntimateDateProposal) => {
      const detail = details[proposal.id];
      if (!detail) return null;
      const input: DateNightPlanInput = {
        partnerId: proposal.partner_id,
        title: `${proposal.proposal_title} (copy)`,
        date: proposal.proposed_date,
        time: proposal.proposed_time,
        locationName: proposal.location_name ?? "",
        locationAddress: proposal.location_address ?? "",
        locationType: proposal.location_type ?? "home",
        isLocationPrivate: proposal.is_location_private ?? true,
        durationMinutes: proposal.duration_minutes ?? null,
        theme: (proposal.activities as any)?.theme ?? "",
        distractionTags: detail.distractions ?? [],
        segments: (proposal.activities as any)?.segments ?? [],
        itinerary: detail.itinerary ?? [],
        positions: detail.positions ?? [],
        message: proposal.text_message ?? "",
        specialRequests: proposal.special_requests ?? "",
        budget: (proposal.activities as any)?.budget ?? null,
        travelMinutes: (proposal.activities as any)?.travel_minutes ?? null,
        checklist: detail.checklist ?? [],
        packingList: detail.packingList ?? [],
        aftercare: detail.aftercare ?? [],
        reminders: detail.reminders ?? [],
      };
      return createPlan(input);
    },
    [createPlan, details],
  );

  const availableTemplates = useMemo(() => templates, [templates]);

  return {
    proposals,
    details,
    templates: availableTemplates,
    loading,
    loadMore,
    reload: load,
    createPlan,
    saveTemplate,
    respond,
    respondWithModification,
    addReflection,
    clonePlan,
  };
}
