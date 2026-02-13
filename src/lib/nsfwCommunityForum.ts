/**
 * NSFW Community Forum
 * Supabase-backed implementation with graceful type handling.
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface NSFWForumCategory {
  id: string;
  category_name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  allows_anonymous: boolean;
  requires_moderation: boolean;
  is_expert_moderated: boolean;
  thread_count: number;
  post_count: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface NSFWForumPost {
  id: string;
  thread_id: string;
  user_id: string | null;
  parent_post_id: string | null;
  content: string;
  is_anonymous: boolean;
  is_expert_answer: boolean;
  is_approved: boolean;
  like_count: number;
  helpful_count: number;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NSFWSupportGroup {
  id: string;
  group_name: string;
  description: string | null;
  category: string | null;
  is_private: boolean;
  requires_approval: boolean;
  max_members: number;
  member_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NSFWCommunityChallenge {
  id: string;
  challenge_name: string;
  description: string | null;
  category: string | null;
  start_date: string;
  end_date: string;
  goal_description: string | null;
  rules: string[] | null;
  prizes: Record<string, unknown> | null;
  participant_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

type AuthedUser = { id: string };

async function requireUser(): Promise<AuthedUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) logger.warn("NSFWCommunityForum: auth.getUser failed", { error: error.message });
  if (!user) {
    toast.error("Please sign in");
    return null;
  }
  return { id: user.id };
}

export async function getNSFWForumCategories(): Promise<NSFWForumCategory[]> {
  try {
    const { data, error } = await supabase
      .from("nsfw_forum_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error("NSFWCommunityForum: get categories failed", { error: error.message });
      return [];
    }
    return (data || []) as unknown as NSFWForumCategory[];
  } catch (error) {
    logger.error("NSFWCommunityForum: get categories error", { error });
    return [];
  }
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
    const user = await requireUser();
    if (!user && !isAnonymous) return null;

    const { data, error } = await fromExtended("nsfw_forum_threads")
      .insert({
        category_id: categoryId,
        user_id: isAnonymous ? null : (user?.id ?? null),
        title,
        content,
        is_anonymous: isAnonymous,
        is_qa_thread: isQAThread,
        is_success_story: isSuccessStory,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWCommunityForum: create thread failed", { error: error.message });
      toast.error("Failed to create thread");
      return null;
    }
    return data as unknown as NSFWForumThread;
  } catch (error) {
    logger.error("NSFWCommunityForum: create thread error", { error });
    toast.error("Failed to create thread");
    return null;
  }
}

export async function getNSFWForumThreads(
  categoryId?: string,
  isQA?: boolean,
  isSuccessStory?: boolean,
): Promise<NSFWForumThread[]> {
  try {
    let query = fromExtended("nsfw_forum_threads").select("*");

    if (categoryId) query = query.eq("category_id", categoryId);
    if (typeof isQA === "boolean") query = query.eq("is_qa_thread", isQA);
    if (typeof isSuccessStory === "boolean") query = query.eq("is_success_story", isSuccessStory);

    const { data, error } = await query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("NSFWCommunityForum: get threads failed", { error: error.message });
      return [];
    }
    return (data || []) as unknown as NSFWForumThread[];
  } catch (error) {
    logger.error("NSFWCommunityForum: get threads error", { error });
    return [];
  }
}

export async function createNSFWForumPost(
  threadId: string,
  content: string,
  isAnonymous: boolean = false,
  parentPostId?: string,
): Promise<NSFWForumPost | null> {
  try {
    const user = await requireUser();
    if (!user && !isAnonymous) return null;

    const { data, error } = await fromExtended("nsfw_forum_posts")
      .insert({
        thread_id: threadId,
        user_id: isAnonymous ? null : (user?.id ?? null),
        content,
        is_anonymous: isAnonymous,
        parent_post_id: parentPostId ?? null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWCommunityForum: create post failed", { error: error.message });
      toast.error("Failed to create post");
      return null;
    }
    return data as unknown as NSFWForumPost;
  } catch (error) {
    logger.error("NSFWCommunityForum: create post error", { error });
    toast.error("Failed to create post");
    return null;
  }
}

export async function getNSFWForumPosts(threadId: string): Promise<NSFWForumPost[]> {
  try {
    const { data, error } = await supabase
      .from("nsfw_forum_posts")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("NSFWCommunityForum: get posts failed", { error: error.message });
      return [];
    }
    return (data || []) as unknown as NSFWForumPost[];
  } catch (error) {
    logger.error("NSFWCommunityForum: get posts error", { error });
    return [];
  }
}

export async function createNSFWSupportGroup(
  groupName: string,
  description: string,
  category?: string,
): Promise<NSFWSupportGroup | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const { data, error } = await fromExtended("nsfw_support_groups")
      .insert({
        created_by: user.id,
        group_name: groupName,
        description,
        category: category ?? null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWCommunityForum: create support group failed", { error: error.message });
      toast.error("Failed to create support group");
      return null;
    }
    return data as unknown as NSFWSupportGroup;
  } catch (error) {
    logger.error("NSFWCommunityForum: create support group error", { error });
    toast.error("Failed to create support group");
    return null;
  }
}

export async function joinNSFWSupportGroup(groupId: string): Promise<NSFWSupportGroup | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const { error } = await fromExtended("nsfw_support_group_members")
      .insert({ group_id: groupId, user_id: user.id });

    if (error) {
      logger.error("NSFWCommunityForum: join support group failed", { error: error.message });
      toast.error("Failed to join group");
      return null;
    }

    const { data: group, error: fetchError } = await fromExtended("nsfw_support_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (fetchError) {
      logger.warn("NSFWCommunityForum: joined but failed to load group", {
        error: fetchError.message,
      });
      return null;
    }

    toast.success("Joined group");
    return group as unknown as NSFWSupportGroup;
  } catch (error) {
    logger.error("NSFWCommunityForum: join support group error", { error });
    toast.error("Failed to join group");
    return null;
  }
}

export async function getNSFWSupportGroups(): Promise<NSFWSupportGroup[]> {
  try {
    const { data, error } = await fromExtended("nsfw_support_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("NSFWCommunityForum: get support groups failed", { error: error.message });
      return [];
    }
    return (data || []) as unknown as NSFWSupportGroup[];
  } catch (error) {
    logger.error("NSFWCommunityForum: get support groups error", { error });
    return [];
  }
}

export async function getNSFWCommunityChallenges(): Promise<NSFWCommunityChallenge[]> {
  try {
    const { data, error } = await fromExtended("nsfw_community_challenges")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("start_date", { ascending: false });

    if (error) {
      logger.error("NSFWCommunityForum: get challenges failed", { error: error.message });
      return [];
    }
    return (data || []) as unknown as NSFWCommunityChallenge[];
  } catch (error) {
    logger.error("NSFWCommunityForum: get challenges error", { error });
    return [];
  }
}

export async function joinNSFWCommunityChallenge(
  challengeId: string,
  isAnonymous: boolean = true,
): Promise<boolean> {
  try {
    const user = await requireUser();
    if (!user) return false;

    const { error } = await fromExtended("nsfw_challenge_participants").insert({
      challenge_id: challengeId,
      user_id: user.id,
      is_anonymous: isAnonymous,
    });

    if (error) {
      logger.error("NSFWCommunityForum: join challenge failed", { error: error.message });
      toast.error("Failed to join challenge");
      return false;
    }

    toast.success("Joined challenge");
    return true;
  } catch (error) {
    logger.error("NSFWCommunityForum: join challenge error", { error });
    toast.error("Failed to join challenge");
    return false;
  }
}
