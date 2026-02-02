/**
 * Community Forum System - Supabase implementation
 *
 * Backed by tables created in `supabase/migrations/20251207000010_community_forum.sql`.
 * RLS enforces per-user write permissions and public read for approved content.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ForumCategory {
  id?: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  color?: string;
  order_index?: number;
  is_nsfw?: boolean;
  is_private?: boolean;
  requires_premium?: boolean;
  post_count?: number;
  thread_count?: number;
  last_activity_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ForumThread {
  id?: string;
  category_id: string;
  user_id?: string;
  title: string;
  content: string;
  is_anonymous?: boolean;
  is_pinned?: boolean;
  is_locked?: boolean;
  is_expert_qa?: boolean;
  is_success_story?: boolean;
  view_count?: number;
  reply_count?: number;
  like_count?: number;
  helpful_count?: number;
  is_approved?: boolean;
  last_reply_at?: string;
  last_reply_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ForumPost {
  id?: string;
  thread_id: string;
  user_id?: string;
  parent_post_id?: string;
  content: string;
  is_anonymous?: boolean;
  is_expert_answer?: boolean;
  like_count?: number;
  helpful_count?: number;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ForumInteraction {
  id?: string;
  user_id?: string;
  content_type: "thread" | "post";
  content_id: string;
  interaction_type: "like" | "helpful" | "bookmark";
  created_at?: string;
}

export interface UserReputation {
  id?: string;
  user_id?: string;
  reputation_points?: number;
  post_count?: number;
  thread_count?: number;
  helpful_marks_received?: number;
  expert_answers_count?: number;
  badges?: string[];
  level?: number;
  updated_at?: string;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function escapeLike(term: string) {
  // Escape characters with special meaning in LIKE patterns: %, _
  return term.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  const { data, error } = await supabase

    .from("forum_categories" as any)
    .select("*")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ForumCategory[];
}

export async function getForumThreads(
  categoryId?: string,
  limit: number = 20,
  offset: number = 0,
): Promise<ForumThread[]> {
  let q = supabase
    .from("forum_threads" as any)
    .select("*")
    .order("is_pinned", { ascending: false });
  q = q
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (categoryId) q = q.eq("category_id", categoryId);
  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ForumThread[];
}

export async function getForumThread(threadId: string): Promise<{
  thread: ForumThread | null;
  posts: ForumPost[];
}> {
  const { data: thread, error: threadErr } = await supabase

    .from("forum_threads" as any)
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (threadErr) throw threadErr;

  const { data: posts, error: postsErr } = await supabase

    .from("forum_posts" as any)
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (postsErr) throw postsErr;
  return {
    thread: (thread ?? null) as unknown as ForumThread | null,
    posts: (posts ?? []) as unknown as ForumPost[],
  };
}

export async function createForumThread(
  thread: Omit<
    ForumThread,
    | "id"
    | "user_id"
    | "created_at"
    | "updated_at"
    | "view_count"
    | "reply_count"
    | "like_count"
    | "helpful_count"
    | "is_approved"
  >,
): Promise<ForumThread | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase

    .from("forum_threads" as any)
    .insert({
      user_id: userId,
      category_id: thread.category_id,
      title: thread.title,
      content: thread.content,
      is_anonymous: thread.is_anonymous ?? false,
      is_success_story: thread.is_success_story ?? false,
      is_expert_qa: thread.is_expert_qa ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return (data ?? null) as unknown as ForumThread | null;
}

export async function createForumPost(
  post: Omit<
    ForumPost,
    "id" | "user_id" | "created_at" | "updated_at" | "like_count" | "helpful_count" | "is_approved"
  >,
): Promise<ForumPost | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase

    .from("forum_posts" as any)
    .insert({
      user_id: userId,
      thread_id: post.thread_id,
      parent_post_id: post.parent_post_id ?? null,
      content: post.content,
      is_anonymous: post.is_anonymous ?? false,
      is_expert_answer: post.is_expert_answer ?? false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return (data ?? null) as unknown as ForumPost | null;
}

export async function interactWithContent(
  contentType: "thread" | "post",
  contentId: string,
  interactionType: "like" | "helpful" | "bookmark",
): Promise<void> {
  const userId = await requireUserId();

  // Toggle interaction (insert if missing; delete if exists)
  const { data: existing, error: existingErr } = await supabase

    .from("forum_interactions" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .eq("interaction_type", interactionType)
    .maybeSingle();

  if (existingErr && existingErr.code !== "PGRST116") throw existingErr;

  if ((existing as any)?.id) {
    const { error } = await supabase

      .from("forum_interactions" as any)
      .delete()
      .eq("id", (existing as any).id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("forum_interactions" as any).insert({
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
    interaction_type: interactionType,
  });
  if (error) throw error;
}

export async function getUserReputation(userId?: string): Promise<UserReputation | null> {
  const resolvedUserId = userId ?? (await requireUserId());
  const { data, error } = await supabase

    .from("forum_user_reputation" as any)
    .select("*")
    .eq("user_id", resolvedUserId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as UserReputation;
  return {
    user_id: resolvedUserId,
    reputation_points: 0,
    post_count: 0,
    thread_count: 0,
    level: 1,
  } as UserReputation;
}

export async function searchForumThreads(
  query: string,
  categoryId?: string,
): Promise<ForumThread[]> {
  const q = query.trim();
  if (!q) return [];

  let builder = supabase.from("forum_threads" as any).select("*");
  if (categoryId) builder = builder.eq("category_id", categoryId);
  const needle = escapeLike(q);
  // Note: PostgREST `ilike` treats patterns; we escape wildcards best-effort.
  builder = builder
    .or(`title.ilike.%${needle}%,content.ilike.%${needle}%`)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data, error } = await builder;
  if (error) throw error;
  return (data ?? []) as unknown as ForumThread[];
}

export async function getUserThreads(userId?: string): Promise<ForumThread[]> {
  const resolvedUserId = userId ?? (await requireUserId());
  const { data, error } = await supabase

    .from("forum_threads" as any)
    .select("*")
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as ForumThread[];
}

export async function getUserPosts(userId?: string): Promise<ForumPost[]> {
  const resolvedUserId = userId ?? (await requireUserId());
  const { data, error } = await supabase

    .from("forum_posts" as any)
    .select("*")
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as ForumPost[];
}

export async function hasUserInteracted(
  contentType: "thread" | "post",
  contentId: string,
  interactionType: "like" | "helpful" | "bookmark",
): Promise<boolean> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase

      .from("forum_interactions" as any)
      .select("id")
      .eq("user_id", userId)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("interaction_type", interactionType)
      .maybeSingle();
    if (error) throw error;
    return Boolean((data as any)?.id);
  } catch {
    return false;
  }
}
