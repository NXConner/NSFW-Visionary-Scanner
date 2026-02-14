/**
 * NSFW Sexual Wellness Analytics
 * Supabase-backed implementation (RLS: users can manage their own rows).
 */

// Modular implementation lives under ./nsfwSexualWellnessAnalytics/*
// Explicit path avoids directory/file resolution self-reference in bundlers.
export * from "./nsfwSexualWellnessAnalytics/index";
