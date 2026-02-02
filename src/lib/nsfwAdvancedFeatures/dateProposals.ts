import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type {
  CreateIntimateDateProposalInput,
  IntimateDateProposal,
  ProposalModifications,
  ProposalResponse,
} from "./types";

export async function getIntimateDateProposals(): Promise<IntimateDateProposal[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("intimate_date_proposals")
      .select("*")
      .or(`creator_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching proposals", { error: error.message });
      return [];
    }

    return (data || []) as unknown as IntimateDateProposal[];
  } catch (error) {
    logger.error("Error in getIntimateDateProposals", { error });
    return [];
  }
}

export async function createIntimateDateProposal(
  partnerId: string,
  proposalData: CreateIntimateDateProposalInput,
): Promise<IntimateDateProposal | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create proposal");
      return null;
    }

    const { fromExtended } = await import("@/lib/supabaseExtensions");
    const { data, error } = await fromExtended("intimate_date_proposals")
      .insert({
        creator_id: user.id,
        partner_id: partnerId,
        proposal_title: proposalData.title,
        proposed_date: proposalData.date,
        proposed_time: proposalData.time,
        location_name: proposalData.location ?? null,
        location_address: proposalData.locationAddress ?? null,
        location_type: proposalData.locationType || "home",
        is_location_private: proposalData.isLocationPrivate ?? true,
        duration_minutes: proposalData.durationMinutes ?? null,
        activities: proposalData.activities,
        specialty_intimacy: proposalData.positions ?? null,
        text_message: proposalData.message ?? null,
        special_requests: proposalData.specialRequests ?? null,
        voice_message_url: proposalData.voiceMessageUrl ?? null,
        images_urls: proposalData.images ?? null,
        gifs_urls: proposalData.gifs ?? null,
        videos_urls: proposalData.videos ?? null,
        adult_emojis: proposalData.emojis ?? null,
        links: proposalData.links ?? null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating proposal", { error: error.message });
      toast.error("Failed to create proposal");
      return null;
    }

    toast.success("Proposal sent to partner!");
    return data as unknown as IntimateDateProposal;
  } catch (error) {
    logger.error("Error in createIntimateDateProposal", { error });
    return null;
  }
}

export async function respondToProposal(
  proposalId: string,
  response: ProposalResponse,
  modifications?: ProposalModifications,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return false;
    }

    const updateData: Record<string, unknown> = {
      proposal_status: response,
      responded_at: new Date().toISOString(),
    };

    if (response === "accepted") {
      updateData.accepted_at = new Date().toISOString();
    } else if (response === "modified" && modifications) {
      updateData.proposal_status = "resubmitted";
      updateData.partner_modified_date = modifications.date ?? null;
      updateData.partner_modified_time = modifications.time ?? null;
      updateData.partner_suggestions = modifications.suggestions ?? null;
      updateData.partner_media_urls = modifications.media ?? null;
    }

    const { error } = await supabase
      .from("intimate_date_proposals")
      .update(updateData)
      .eq("id", proposalId)
      .eq("partner_id", user.id);

    if (error) {
      logger.error("Error responding to proposal", { error: error.message });
      toast.error("Failed to respond");
      return false;
    }

    toast.success(`Proposal ${response}!`);
    return true;
  } catch (error) {
    logger.error("Error in respondToProposal", { error });
    return false;
  }
}
