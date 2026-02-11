/**
 * NSFW Community Forum
 * Handles NSFW discussion forums, anonymous posting, Q&A, success stories, support groups, and expert moderation
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";
import { toast } from "sonner";
import { fromExtended } from "@/lib/supabaseExtensions";

// ==================== NSFW Forum Categories ====================

export interface NSFWForumCategory {
  id: string;
  category_name: string;
  description: string | null;
  icon_name?: string | null;
  thread_count?: number | null;
  post_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function getNSFWForumCategories(): Promise<NSFWForumCategory[]> {
  try {
    const { data, error } = await supabase
      .from("nsfw_forum_categories")
      .select("*")
      .order("last_activity_at", { ascending: false });

    if (error) {
      logger.error("Error fetching categories", { error: error.message });
      return [];
    }

    return (data || []) as NSFWForumCategory[];
  } catch (error) {
    logger.error("Error in getNSFWForumCategories", { error });
    return [];
  }
}

// ==================== NSFW Forum Threads ====================

export interface NSFWForumThread {
  id: string;
  category_id: string;
  user_id: string | null;
  title: string;
  content: string;
  is_anonymous: boolean;
  is_qa_thread: boolean;
  is_success_story: boolean;
  is_support_group: boolean;
  is_approved: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  moderation_notes: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  view_count: number;
  reply_count: number;
  like_count: number;
  helpful_count: number;
  last_reply_at: string | null;
  last_reply_by: string | null;
  created_at: string;
  updated_at: string;
}

function isoStringOrNow(value: unknown): string {
  const s = typeof value === "string" ? value : value instanceof Date ? value.toISOString() : "";
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
}

function normalizeThreadRow(row: any): NSFWForumThread {
  return {
    id: String(row?.id ?? ""),
    category_id: String(row?.category_id ?? ""),
    user_id: row?.user_id ? String(row.user_id) : null,
    title: String(row?.thread_title ?? row?.title ?? ""),
    content: String(row?.thread_content ?? row?.content ?? ""),
    is_anonymous: Boolean(row?.is_anonymous),
    is_qa_thread: Boolean(row?.is_qa_thread),
    is_success_story: Boolean(row?.is_success_story),
    is_support_group: Boolean(row?.is_support_group),
    is_approved: Boolean(row?.is_approved),
    is_pinned: Boolean(row?.is_pinned),
    is_locked: Boolean(row?.is_locked),
    moderation_notes: row?.moderation_notes != null ? String(row.moderation_notes) : null,
    moderated_by: row?.moderated_by != null ? String(row.moderated_by) : null,
    moderated_at: row?.moderated_at != null ? String(row.moderated_at) : null,
    view_count: Number(row?.view_count ?? 0),
    reply_count: Number(row?.reply_count ?? 0),
    like_count: Number(row?.like_count ?? 0),
    helpful_count: Number(row?.helpful_count ?? 0),
    last_reply_at: row?.last_reply_at != null ? String(row.last_reply_at) : null,
    last_reply_by:
      row?.last_reply_by != null
        ? String(row.last_reply_by)
        : row?.last_reply_user_id != null
          ? String(row.last_reply_user_id)
          : null,
    created_at: isoStringOrNow(row?.created_at),
    updated_at: isoStringOrNow(row?.updated_at ?? row?.created_at),
  };
}

export async function createNSFWForumThread(
  categoryId: string,
  title: string,
  content: string,
  isAnonymous: boolean = false,
  isQAThread: boolean = false,
  isSuccessStory: boolean = false,
): Promise<NSFWForumThread | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !isAnonymous) {
      toast.error("Please sign in to create a thread");
      return null;
    }

    const base = {
      category_id: categoryId,
      user_id: isAnonymous ? null : user?.id || null,
      is_anonymous: isAnonymous,
    };
    const attempts: Array<Record<string, unknown>> = [
      {
        ...base,
        thread_title: title,
        thread_content: content,
        is_qa_thread: isQAThread,
        is_success_story: isSuccessStory,
      },
      { ...base, thread_title: title, thread_content: content },
      { ...base, title, content, is_qa_thread: isQAThread, is_success_story: isSuccessStory },
      { ...base, title, content },
    ];

    let created: any = null;
    let lastError: string | null = null;
    for (const payload of attempts) {
      const { data, error } = await fromExtended("nsfw_forum_threads")
        .insert(payload)
        .select("*")
        .single();
      if (!error) {
        created = data;
        break;
      }
      lastError = error.message;
    }

    if (!created) {
      logger.error("Error creating thread", { error: lastError ?? "Unknown error" });
      toast.error("Failed to create thread");
      return null;
    }

    toast.success("Thread created!");
    return normalizeThreadRow(created);
  } catch (error) {
    logger.error("Error in createNSFWForumThread", { error });
    return null;
  }
}

export async function getNSFWForumThreads(
  categoryId?: string,
  isSuccessStory?: boolean,
): Promise<NSFWForumThread[]> {
  try {
    const baseQuery = () =>
      fromExtended("nsfw_forum_threads")
        .select("*")
        .eq("is_approved", true)
        .order("is_pinned", { ascending: false })
        .order("last_reply_at", { ascending: false })
        .order("created_at", { ascending: false });

    let query = baseQuery();
    if (categoryId) query = query.eq("category_id", categoryId);
    if (isSuccessStory !== undefined) query = query.eq("is_success_story", isSuccessStory);

    let { data, error } = await query;
    if (error && isSuccessStory !== undefined) {
      // Some environments may not have success-story columns; retry without the filter.
      query = baseQuery();
      if (categoryId) query = query.eq("category_id", categoryId);
      const retry = await query;
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      logger.error("Error fetching threads", { error: error.message });
      return [];
    }

    return (Array.isArray(data) ? data : []).map(normalizeThreadRow);
  } catch (error) {
    logger.error("Error in getNSFWForumThreads", { error });
    return [];
  }
}

// ==================== NSFW Forum Posts ====================

export interface NSFWForumPost {
  id: string;
  thread_id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  is_expert_answer: boolean;
  like_count: number;
  helpful_count: number;
  is_approved: boolean;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

function normalizePostRow(row: any): NSFWForumPost {
  return {
    id: String(row?.id ?? ""),
    thread_id: String(row?.thread_id ?? ""),
    user_id: row?.user_id ? String(row.user_id) : null,
    content: String(row?.post_content ?? row?.content ?? ""),
    is_anonymous: Boolean(row?.is_anonymous),
    is_expert_answer: Boolean(row?.is_expert_answer),
    like_count: Number(row?.like_count ?? 0),
    helpful_count: Number(row?.helpful_count ?? 0),
    is_approved: Boolean(row?.is_approved),
    moderation_notes: row?.moderation_notes != null ? String(row.moderation_notes) : null,
    created_at: isoStringOrNow(row?.created_at),
    updated_at: isoStringOrNow(row?.updated_at ?? row?.created_at),
  };
}

export async function createNSFWForumPost(
  threadId: string,
  content: string,
  isAnonymous: boolean = false,
): Promise<NSFWForumPost | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !isAnonymous) {
      toast.error("Please sign in to post");
      return null;
    }

    const base = {
      thread_id: threadId,
      user_id: isAnonymous ? null : user?.id || null,
      is_anonymous: isAnonymous,
    };
    const attempts: Array<Record<string, unknown>> = [
      { ...base, post_content: content, is_expert_answer: false },
      { ...base, post_content: content },
      { ...base, content, is_expert_answer: false },
      { ...base, content },
    ];

    let created: any = null;
    let lastError: string | null = null;
    for (const payload of attempts) {
      const { data, error } = await fromExtended("nsfw_forum_posts")
        .insert(payload)
        .select("*")
        .single();
      if (!error) {
        created = data;
        break;
      }
      lastError = error.message;
    }

    if (!created) {
      logger.error("Error creating post", { error: lastError ?? "Unknown error" });
      toast.error("Failed to create post");
      return null;
    }

    // Best-effort thread counters update (avoid relying on optional RPCs).
    try {
      const nowIso = new Date().toISOString();
      const threadRes = await fromExtended("nsfw_forum_threads")
        .select("reply_count")
        .eq("id", threadId)
        .maybeSingle();
      const nextCount = Number((threadRes.data as any)?.reply_count ?? 0) + 1;
      await fromExtended("nsfw_forum_threads")
        .update({
          reply_count: nextCount,
          last_reply_at: nowIso,
          last_reply_user_id: user?.id ?? null,
        })
        .eq("id", threadId);
    } catch {
      // ignore
    }

    toast.success("Post created!");
    return normalizePostRow(created);
  } catch (error) {
    logger.error("Error in createNSFWForumPost", { error });
    return null;
  }
}

export async function getNSFWForumPosts(threadId: string): Promise<NSFWForumPost[]> {
  try {
    const { data, error } = await fromExtended("nsfw_forum_posts")
      .select("*")
      .eq("thread_id", threadId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error fetching posts", { error: error.message });
      return [];
    }

    return (Array.isArray(data) ? data : []).map(normalizePostRow);
  } catch (error) {
    logger.error("Error in getNSFWForumPosts", { error });
    return [];
  }
}

// ==================== NSFW Support Groups ====================

export interface NSFWSupportGroup {
  id: string;
  user_id: string;
  group_name: string;
  description: string | null;
  category: "health_condition" | "treatment" | "recovery" | "general_support" | "anonymous" | null;
  is_private: boolean;
  requires_approval: boolean;
  is_anonymous: boolean;
  member_count: number;
  post_count: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getNSFWSupportGroups(): Promise<NSFWSupportGroup[]> {
  try {
    const { data, error } = await fromExtended("nsfw_support_groups")
      .select("*")
      .order("last_activity_at", { ascending: false });

    if (error) {
      logger.error("Error fetching support groups", { error: error.message });
      return [];
    }

    return (data || []) as NSFWSupportGroup[];
  } catch (error) {
    logger.error("Error in getNSFWSupportGroups", { error });
    return [];
  }
}

export async function createNSFWSupportGroup(
  groupName: string,
  description: string,
  category: NSFWSupportGroup["category"],
  isPrivate: boolean = false,
): Promise<NSFWSupportGroup | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to create a support group");
      return null;
    }

    const { data, error } = await fromExtended("nsfw_support_groups")
      .insert({
        user_id: user.id,
        group_name: groupName,
        description,
        category,
        is_private: isPrivate,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating support group", { error: error.message });
      toast.error("Failed to create support group");
      return null;
    }

    // Add creator as admin member
    const memberAttempts: Array<Record<string, unknown>> = [
      { group_id: data.id, user_id: user.id, role: "admin" },
      { group_id: data.id, user_id: user.id },
    ];
    for (const payload of memberAttempts) {
      const { error: memberError } = await fromExtended("nsfw_support_group_members").insert(
        payload,
      );
      if (!memberError) break;
    }

    toast.success("Support group created!");
    return data as NSFWSupportGroup;
  } catch (error) {
    logger.error("Error in createNSFWSupportGroup", { error });
    return null;
  }
}

export async function joinNSFWSupportGroup(
  groupId: string,
  params?: { isAnonymous?: boolean },
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to join a support group");
      return false;
    }

    // Already a member?
    const existing = await fromExtended("nsfw_support_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing.error && existing.data?.id) {
      toast.success("You're already a member");
      return true;
    }

    const attempts: Array<Record<string, unknown>> = [
      {
        group_id: groupId,
        user_id: user.id,
        role: "member",
        is_anonymous: Boolean(params?.isAnonymous),
      },
      { group_id: groupId, user_id: user.id, role: "member" },
      { group_id: groupId, user_id: user.id },
    ];

    let lastError: string | null = null;
    for (const payload of attempts) {
      const { error } = await fromExtended("nsfw_support_group_members").insert(payload);
      if (!error) {
        toast.success("Joined support group!");
        return true;
      }
      lastError = error.message;
    }

    logger.error("Error joining support group", { error: lastError ?? "Unknown error" });
    toast.error("Failed to join support group");
    return false;
  } catch (error) {
    logger.error("Error in joinNSFWSupportGroup", { error });
    toast.error("Failed to join support group");
    return false;
  }
}

// ==================== NSFW Community Challenges ====================

export interface NSFWCommunityChallenge {
  id: string;
  challenge_name: string;
  description: string;
  category: string | null;
  start_date: string;
  end_date: string;
  duration_days: number | null;
  participant_count: number;
  completion_count: number;
  has_leaderboard: boolean;
  is_anonymous_leaderboard: boolean;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export async function getNSFWCommunityChallenges(): Promise<NSFWCommunityChallenge[]> {
  try {
    const { data, error } = await fromExtended("nsfw_community_challenges")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("start_date", { ascending: false });

    if (error) {
      logger.error("Error fetching challenges", { error: error.message });
      return [];
    }

    return (data || []) as NSFWCommunityChallenge[];
  } catch (error) {
    logger.error("Error in getNSFWCommunityChallenges", { error });
    return [];
  }
}

export async function joinNSFWCommunityChallenge(
  challengeId: string,
  isAnonymous: boolean = true,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to join a challenge");
      return false;
    }

    // If already joined, treat as success.
    const existing = await fromExtended("nsfw_challenge_participants")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing.error && existing.data?.id) {
      toast.success("You're already participating");
      return true;
    }

    const attempts: Array<Record<string, unknown>> = [
      { challenge_id: challengeId, user_id: user.id, is_anonymous: Boolean(isAnonymous) },
      { challenge_id: challengeId, user_id: user.id },
    ];

    let lastError: string | null = null;
    for (const payload of attempts) {
      const { error } = await fromExtended("nsfw_challenge_participants").insert(payload);
      if (!error) {
        toast.success("Joined challenge!");
        return true;
      }
      lastError = error.message;
    }

    logger.error("Error joining challenge", { error: lastError ?? "Unknown error" });
    toast.error("Failed to join challenge");
    return false;
  } catch (error) {
    logger.error("Error in joinNSFWCommunityChallenge", { error });
    toast.error("Failed to join challenge");
    return false;
  }
}
