/**
 * Community System (compat wrapper)
 *
 * This file previously contained a stub implementation. The app's actively-used
 * forum system lives in `src/lib/communityForum.ts` (threads/posts/interactions).
 *
 * To avoid duplicating overlapping “forum” stacks, this module is now a thin
 * wrapper around the existing community forum implementation.
 */

import { toast } from "sonner";
import {
  createForumPost as createThreadPost,
  createForumThread,
  getForumCategories,
  getForumThread,
  getForumThreads,
  interactWithContent,
} from "@/lib/communityForum";

export interface Forum {
  id: string;
  name: string;
  description: string | null;
  category: "general" | "health" | "progress" | "support" | "nsfw" | "education";
  icon_url: string | null;
  is_nsfw: boolean;
  is_active: boolean;
  member_count: number;
  post_count: number;
  created_at: string;
}

export interface ForumPost {
  id: string;
  forum_id: string;
  user_id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  tags: string[];
  created_at: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
}

export async function getForums(): Promise<Forum[]> {
  const cats = await getForumCategories();
  return cats.map(c => ({
    id: String(c.id),
    name: c.name,
    description: c.description ?? null,
    category: (c.slug as any) ?? "general",
    icon_url: (c.icon as any) ?? null,
    is_nsfw: Boolean(c.is_nsfw),
    is_active: true,
    member_count: 0,
    post_count: Number(c.post_count ?? 0),
    created_at: c.created_at ?? new Date().toISOString(),
  })) as Forum[];
}

export async function getForumPosts(forumId: string): Promise<ForumPost[]> {
  const threads = await getForumThreads(forumId, 50, 0);
  return threads.map(t => ({
    id: String(t.id),
    forum_id: String(t.category_id),
    user_id: String(t.user_id ?? ""),
    title: t.title,
    content: t.content,
    is_anonymous: Boolean(t.is_anonymous),
    is_pinned: Boolean(t.is_pinned),
    is_locked: Boolean(t.is_locked),
    view_count: Number(t.view_count ?? 0),
    like_count: Number(t.like_count ?? 0),
    comment_count: Number(t.reply_count ?? 0),
    tags: [],
    created_at: t.created_at ?? new Date().toISOString(),
  })) as ForumPost[];
}

export async function createForumPost(
  forumId: string,
  title: string,
  content: string,
  isAnonymous: boolean,
): Promise<ForumPost | null> {
  const thread = await createForumThread({
    category_id: forumId,
    title,
    content,
    is_anonymous: isAnonymous,
    is_success_story: false,
    is_expert_qa: false,
  });
  if (!thread?.id) return null;
  return {
    id: String(thread.id),
    forum_id: String(thread.category_id),
    user_id: String(thread.user_id ?? ""),
    title: thread.title,
    content: thread.content,
    is_anonymous: Boolean(thread.is_anonymous),
    is_pinned: Boolean(thread.is_pinned),
    is_locked: Boolean(thread.is_locked),
    view_count: Number(thread.view_count ?? 0),
    like_count: Number(thread.like_count ?? 0),
    comment_count: Number(thread.reply_count ?? 0),
    tags: [],
    created_at: thread.created_at ?? new Date().toISOString(),
  } as ForumPost;
}

export async function likePost(postId: string): Promise<boolean> {
  await interactWithContent("thread", postId, "like");
  return true;
}

export async function getComments(postId: string): Promise<ForumComment[]> {
  const { posts } = await getForumThread(postId);
  return posts.map(p => ({
    id: String(p.id),
    post_id: String(p.thread_id),
    user_id: String(p.user_id ?? ""),
    content: p.content,
    like_count: Number(p.like_count ?? 0),
    created_at: p.created_at ?? new Date().toISOString(),
  })) as ForumComment[];
}

export async function createComment(postId: string, content: string): Promise<ForumComment | null> {
  try {
    const post = await createThreadPost({ thread_id: postId, content, is_anonymous: false });
    if (!post?.id) return null;
    toast.success("Comment posted");
    return {
      id: String(post.id),
      post_id: String(post.thread_id),
      user_id: String(post.user_id ?? ""),
      content: post.content,
      like_count: Number(post.like_count ?? 0),
      created_at: post.created_at ?? new Date().toISOString(),
    } as ForumComment;
  } catch {
    return null;
  }
}
