import { supabase } from "@/integrations/supabase/client";

export const STORAGE_BUCKETS = {
  USER_UPLOADS: "user-uploads",
  USER_MEDIA: "user-media",
  VIDEOS: "videos",
  IMAGES: "images",
  AUDIO: "audio",
  SCREENSHOTS: "screenshots",
  RECORDINGS: "recordings",
  EXPERT_CONTENT: "expert-content",
  NSFW_CONTENT: "nsfw-content",
} as const;

export function getFileUrl(path: string, bucket: string = STORAGE_BUCKETS.USER_UPLOADS): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ? String(data.publicUrl) : "";
}
